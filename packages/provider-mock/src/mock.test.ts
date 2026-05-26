import { describe, it, expect } from 'vitest';
import { MockFlightProvider } from './mock.js';
import type { SearchRequest } from '@open-travel-agent/shared-types';

describe('MockFlightProvider', () => {
  const provider = new MockFlightProvider();

  const baseRequest: SearchRequest = {
    tripType: 'round-trip',
    origin: 'DFW',
    destination: 'CDG',
    departureDate: '2026-09-05',
    returnDate: '2026-09-12',
    passengers: 1,
    cabin: 'ECONOMY',
    currency: 'USD',
  };

  it('returns search results', async () => {
    const result = await provider.search(baseRequest);
    expect(result.provider).toBe('mock');
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.searchTimestamp).toBeTruthy();
  });

  it('offers have proper structure', async () => {
    const result = await provider.search(baseRequest);
    const offer = result.offers[0];
    expect(offer.id).toBeTruthy();
    expect(offer.outbound.segments.length).toBeGreaterThan(0);
    expect(offer.price.total).toBeGreaterThan(0);
    expect(offer.price.currency).toBe('USD');
  });

  it('includes inbound for round-trip', async () => {
    const result = await provider.search(baseRequest);
    for (const offer of result.offers) {
      expect(offer.inbound).toBeDefined();
      expect(offer.inbound!.segments.length).toBeGreaterThan(0);
    }
  });

  it('omits inbound for one-way', async () => {
    const result = await provider.search({
      ...baseRequest,
      tripType: 'one-way',
      returnDate: undefined,
    });
    for (const offer of result.offers) {
      expect(offer.inbound).toBeUndefined();
    }
  });

  it('filters direct-only flights', async () => {
    const result = await provider.search({
      ...baseRequest,
      directOnly: true,
    });
    for (const offer of result.offers) {
      expect(offer.outbound.stops).toBe(0);
    }
  });

  it('filters by max stops', async () => {
    const result = await provider.search({
      ...baseRequest,
      maxStops: 0,
    });
    for (const offer of result.offers) {
      expect(offer.outbound.stops).toBe(0);
    }
  });

  it('scales price by passenger count', async () => {
    const double = await provider.search({ ...baseRequest, passengers: 2 });
    for (const offer of double.offers) {
      expect(offer.price.perPassenger).toBeLessThan(offer.price.total);
    }
  });
});
