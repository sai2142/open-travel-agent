import { describe, it, expect } from 'vitest';
import { DuffelFlightProvider } from './duffel.js';
import type { SearchRequest } from '@open-travel-agent/shared-types';
import { config } from 'dotenv';

config();

const token = process.env.DUFFEL_ACCESS_TOKEN;
const runLive = process.env.TEST_DUFFEL_LIVE === 'true';

describe.runIf(runLive)('DuffelFlightProvider (live sandbox)', () => {
  const provider = new DuffelFlightProvider({
    token: token!,
    environment: 'test',
  });

  const baseRequest: SearchRequest = {
    tripType: 'round-trip',
    origin: 'LHR',
    destination: 'JFK',
    departureDate: '2026-12-01',
    returnDate: '2026-12-08',
    passengers: 1,
    cabin: 'ECONOMY',
    currency: 'USD',
  };

  it('returns search results from Duffel sandbox', async () => {
    const result = await provider.search(baseRequest);
    expect(result.provider).toBe('duffel');
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.searchTimestamp).toBeTruthy();
  }, 30_000);

  it('offers have normalized structure', async () => {
    const result = await provider.search(baseRequest);
    const offer = result.offers[0];
    expect(offer.id).toBeTruthy();
    expect(offer.provider).toBe('duffel');
    expect(offer.outbound.segments.length).toBeGreaterThan(0);
    expect(offer.price.total).toBeGreaterThan(0);
    expect(offer.price.currency).toBeTruthy();
    expect(offer.validatingCarrier).toBeTruthy();

    const seg = offer.outbound.segments[0];
    expect(seg.carrier).toMatch(/^[A-Z0-9]{2}$/);
    expect(seg.flightNumber).toBeTruthy();
    expect(seg.departure.airport).toBe('LHR');
    expect(seg.departure.at).toBeTruthy();
  }, 30_000);

  it('includes inbound for round-trip', async () => {
    const result = await provider.search(baseRequest);
    const offer = result.offers[0];
    expect(offer.inbound).toBeDefined();
    expect(offer.inbound!.segments.length).toBeGreaterThan(0);
  }, 30_000);

  it('omits inbound for one-way', async () => {
    const result = await provider.search({
      ...baseRequest,
      tripType: 'one-way',
      returnDate: undefined,
    });
    const offer = result.offers[0];
    expect(offer.inbound).toBeUndefined();
  }, 30_000);

  it('respects directOnly by setting max_connections=0', async () => {
    const result = await provider.search({
      ...baseRequest,
      directOnly: true,
    });
    for (const offer of result.offers) {
      expect(offer.outbound.stops).toBe(0);
    }
  }, 30_000);

  it('filters by maxPrice client-side', async () => {
    const result = await provider.search({
      ...baseRequest,
      maxPrice: 100,
    });
    for (const offer of result.offers) {
      expect(offer.price.total).toBeLessThanOrEqual(100);
    }
  }, 30_000);
});

describe('DuffelFlightProvider (unit)', () => {
  it('builds correct request body for round-trip', () => {
    const provider = new DuffelFlightProvider({ token: 'test', environment: 'test' });
    // Access the private method via any cast for unit testing
    const body = (provider as any).buildOfferRequestBody({
      tripType: 'round-trip',
      origin: 'DFW',
      destination: 'CDG',
      departureDate: '2026-09-05',
      returnDate: '2026-09-12',
      passengers: 2,
      cabin: 'BUSINESS',
      currency: 'USD',
    });

    expect(body.slices).toHaveLength(2);
    expect(body.slices[0].origin).toBe('DFW');
    expect(body.slices[0].destination).toBe('CDG');
    expect(body.slices[0].departure_date).toBe('2026-09-05');
    expect(body.slices[1].origin).toBe('CDG');
    expect(body.slices[1].destination).toBe('DFW');
    expect(body.slices[1].departure_date).toBe('2026-09-12');
    expect(body.passengers).toHaveLength(2);
    expect(body.cabin_class).toBe('business');
    expect(body.return_offers).toBe(true);
  });

  it('builds correct request body for one-way', () => {
    const provider = new DuffelFlightProvider({ token: 'test', environment: 'test' });
    const body = (provider as any).buildOfferRequestBody({
      tripType: 'one-way',
      origin: 'DFW',
      destination: 'CDG',
      departureDate: '2026-09-05',
      passengers: 1,
      currency: 'USD',
    });

    expect(body.slices).toHaveLength(1);
    expect(body.passengers).toHaveLength(1);
  });

  it('maps directOnly to max_connections=0', () => {
    const provider = new DuffelFlightProvider({ token: 'test', environment: 'test' });
    const body = (provider as any).buildOfferRequestBody({
      tripType: 'one-way',
      origin: 'DFW',
      destination: 'CDG',
      departureDate: '2026-09-05',
      passengers: 1,
      directOnly: true,
      currency: 'USD',
    });

    expect(body.slices[0].max_connections).toBe(0);
  });

  it('maps maxStops to max_connections', () => {
    const provider = new DuffelFlightProvider({ token: 'test', environment: 'test' });
    const body = (provider as any).buildOfferRequestBody({
      tripType: 'one-way',
      origin: 'DFW',
      destination: 'CDG',
      departureDate: '2026-09-05',
      passengers: 1,
      maxStops: 1,
      currency: 'USD',
    });

    expect(body.slices[0].max_connections).toBe(1);
  });
});
