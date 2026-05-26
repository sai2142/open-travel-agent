export interface Airport {
  code: string;
  name?: string;
  city?: string;
  country?: string;
}

export interface FlightSegment {
  carrier: string;
  carrierName?: string;
  flightNumber: string;
  departure: {
    airport: string;
    terminal?: string;
    at: string; // ISO 8601
  };
  arrival: {
    airport: string;
    terminal?: string;
    at: string; // ISO 8601
  };
  duration: string; // ISO 8601 duration (e.g., "PT2H30M")
  aircraft?: string;
  cabin: CabinClass;
  fareClass?: string;
}

export interface Itinerary {
  segments: FlightSegment[];
  duration: string; // total ISO 8601 duration
  stops: number;
}

export interface Price {
  total: number;
  currency: string;
  base?: number;
  fees?: number;
  taxes?: number;
  perPassenger?: number;
}

export interface FlightOffer {
  id: string;
  provider: string;
  outbound: Itinerary;
  inbound?: Itinerary;
  price: Price;
  seatsRemaining?: number;
  bookingUrl?: string;
  rawProviderData?: unknown;
  validatingCarrier?: string;
  lastTicketingDate?: string;
}

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export type TripType = 'one-way' | 'round-trip' | 'multi-city';

export interface SearchRequest {
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD for round-trip
  passengers: number;
  cabin?: CabinClass;
  maxStops?: number;
  maxPrice?: number;
  preferredAirlines?: string[];
  directOnly?: boolean;
  currency?: string;
}

export interface MultiCityLeg {
  origin: string;
  destination: string;
  date: string;
}

export interface MultiCitySearchRequest {
  tripType: 'multi-city';
  legs: MultiCityLeg[];
  passengers: number;
  cabin?: CabinClass;
  maxStops?: number;
  maxPrice?: number;
  currency?: string;
}

export interface SearchResult {
  request: SearchRequest | MultiCitySearchRequest;
  offers: FlightOffer[];
  searchTimestamp: string;
  provider: string;
}
