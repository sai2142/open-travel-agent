import type {
  FlightProvider,
  SearchRequest,
  SearchResult,
  FlightOffer,
  FlightSegment,
  Itinerary,
  CabinClass,
} from '@open-travel-agent/shared-types';

interface DuffelConfig {
  token: string;
  environment: 'test' | 'production';
}

export class DuffelFlightProvider implements FlightProvider {
  readonly name = 'duffel';
  private config: DuffelConfig;

  constructor(config: DuffelConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return 'https://api.duffel.com';
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    const body = this.buildOfferRequestBody(request);

    const response = await this.fetchWithRetry(`${this.baseUrl}/air/offer_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ data: body }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let hint = '';
      if (response.status === 401) {
        hint = '\n  → Check DUFFEL_ACCESS_TOKEN — test tokens start with duffel_test_';
      } else if (response.status === 403) {
        hint = '\n  → Your Duffel token is missing required permissions.'
          + '\n  → Go to https://app.duffel.com → Developers → Access tokens'
          + '\n  → Create a new test token with "Full access" or at minimum the "Offer requests" permission.';
      } else if (response.status === 422) {
        hint = '\n  → Check that airport codes and dates are valid.';
      }
      throw new Error(`Duffel search failed (${response.status})${hint}\n  ${errorBody}`);
    }

    const json = (await response.json()) as DuffelOfferRequestResponse;
    let offers = json.data.offers.map((raw) => this.normalizeOffer(raw));

    if (request.directOnly) {
      offers = offers.filter((o) => o.outbound.stops === 0 && (!o.inbound || o.inbound.stops === 0));
    }

    if (request.maxStops !== undefined) {
      offers = offers.filter((o) => o.outbound.stops <= request.maxStops! && (!o.inbound || o.inbound.stops <= request.maxStops!));
    }

    if (request.maxPrice !== undefined) {
      offers = offers.filter((o) => o.price.total <= request.maxPrice!);
    }

    return {
      request,
      offers,
      searchTimestamp: new Date().toISOString(),
      provider: this.name,
    };
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    retries: number = 2,
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, init);

      if (response.status === 429 && attempt < retries) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      return response;
    }

    throw new Error('Duffel: max retries exceeded');
  }

  private buildOfferRequestBody(request: SearchRequest): DuffelOfferRequestBody {
    const maxConnections = request.directOnly
      ? 0
      : request.maxStops;

    const slices: DuffelSliceRequest[] = [
      {
        origin: request.origin,
        destination: request.destination,
        departure_date: request.departureDate,
        ...(maxConnections !== undefined && { max_connections: maxConnections }),
      },
    ];

    if (request.returnDate) {
      slices.push({
        origin: request.destination,
        destination: request.origin,
        departure_date: request.returnDate,
        ...(maxConnections !== undefined && { max_connections: maxConnections }),
      });
    }

    const passengers: DuffelPassenger[] = Array.from(
      { length: request.passengers },
      () => ({ type: 'adult' as const }),
    );

    return {
      slices,
      passengers,
      return_offers: true,
      ...(request.cabin && { cabin_class: mapCabinClass(request.cabin) }),
    };
  }

  private normalizeOffer(raw: DuffelOffer): FlightOffer {
    const slices = raw.slices;
    const outbound = this.normalizeSlice(slices[0]);
    const inbound = slices.length > 1 ? this.normalizeSlice(slices[1]) : undefined;

    const totalAmount = parseFloat(raw.total_amount);
    const passengers = raw.passengers?.length || 1;

    return {
      id: raw.id,
      provider: this.name,
      outbound,
      inbound,
      price: {
        total: totalAmount,
        currency: raw.total_currency,
        base: raw.base_amount ? parseFloat(raw.base_amount) : undefined,
        taxes: raw.tax_amount ? parseFloat(raw.tax_amount) : undefined,
        perPassenger: passengers > 1 ? totalAmount / passengers : undefined,
      },
      validatingCarrier: raw.owner?.iata_code,
      rawProviderData: raw,
    };
  }

  private normalizeSlice(slice: DuffelSlice): Itinerary {
    const segments: FlightSegment[] = slice.segments.map((seg) => {
      const segDuration = seg.duration || computeDuration(seg.departing_at, seg.arriving_at);

      const cabin = extractCabinClass(seg.passengers) || 'ECONOMY';

      return {
        carrier: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code || 'XX',
        carrierName: seg.marketing_carrier?.name,
        flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
        departure: {
          airport: seg.origin.iata_code,
          terminal: seg.origin_terminal || undefined,
          at: seg.departing_at,
        },
        arrival: {
          airport: seg.destination.iata_code,
          terminal: seg.destination_terminal || undefined,
          at: seg.arriving_at,
        },
        duration: segDuration,
        aircraft: seg.aircraft?.iata_code,
        cabin,
      };
    });

    const totalDuration = slice.duration || computeTotalDuration(segments);

    return {
      segments,
      duration: totalDuration,
      stops: segments.length - 1,
    };
  }
}

function computeDuration(departAt: string, arriveAt: string): string {
  const dep = new Date(departAt).getTime();
  const arr = new Date(arriveAt).getTime();
  const diffMin = Math.max(0, Math.round((arr - dep) / 60_000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `PT${h}H${m}M`;
}

function computeTotalDuration(segments: FlightSegment[]): string {
  if (segments.length === 0) return 'PT0H0M';
  const first = new Date(segments[0].departure.at).getTime();
  const last = new Date(segments[segments.length - 1].arrival.at).getTime();
  const diffMin = Math.max(0, Math.round((last - first) / 60_000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `PT${h}H${m}M`;
}

function extractCabinClass(passengers?: DuffelSegmentPassenger[]): CabinClass | undefined {
  if (!passengers || passengers.length === 0) return undefined;
  const cabin = passengers[0].cabin_class;
  if (!cabin) return undefined;
  const map: Record<string, CabinClass> = {
    economy: 'ECONOMY',
    premium_economy: 'PREMIUM_ECONOMY',
    business: 'BUSINESS',
    first: 'FIRST',
  };
  return map[cabin];
}

function mapCabinClass(cabin: CabinClass): string {
  const map: Record<CabinClass, string> = {
    ECONOMY: 'economy',
    PREMIUM_ECONOMY: 'premium_economy',
    BUSINESS: 'business',
    FIRST: 'first',
  };
  return map[cabin];
}

// --- Duffel API types (internal) ---

interface DuffelOfferRequestBody {
  slices: DuffelSliceRequest[];
  passengers: DuffelPassenger[];
  return_offers: boolean;
  cabin_class?: string;
}

interface DuffelSliceRequest {
  origin: string;
  destination: string;
  departure_date: string;
  max_connections?: number;
}

interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
}

interface DuffelOfferRequestResponse {
  data: {
    id: string;
    offers: DuffelOffer[];
  };
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount?: string;
  tax_amount?: string;
  owner?: { iata_code: string; name: string };
  slices: DuffelSlice[];
  passengers?: { id: string }[];
}

interface DuffelSlice {
  id: string;
  duration?: string;
  fare_brand_name?: string | null;
  segments: DuffelSegment[];
}

interface DuffelSegment {
  id: string;
  marketing_carrier?: { iata_code: string; name: string };
  marketing_carrier_flight_number?: string;
  operating_carrier?: { iata_code: string; name: string };
  origin: { iata_code: string; name?: string };
  destination: { iata_code: string; name?: string };
  origin_terminal?: string | null;
  destination_terminal?: string | null;
  departing_at: string;
  arriving_at: string;
  duration?: string;
  aircraft?: { iata_code: string; name: string };
  passengers?: DuffelSegmentPassenger[];
}

interface DuffelSegmentPassenger {
  passenger_id: string;
  cabin_class?: string;
  cabin_class_marketing_name?: string;
}
