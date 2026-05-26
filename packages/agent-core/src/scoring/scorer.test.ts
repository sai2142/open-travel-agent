import { describe, it, expect } from 'vitest';
import { scoreOffers, parseDurationMinutes } from './scorer.js';
import type { FlightOffer, UserPreferences, UserCardProfile, CreditCard } from '@open-travel-agent/shared-types';

const DEFAULT_SEGMENT = {
  carrier: 'AA',
  carrierName: 'American Airlines',
  flightNumber: 'AA100',
  departure: { airport: 'DFW', at: '2026-09-05T08:00:00' },
  arrival: { airport: 'CDG', at: '2026-09-05T22:00:00' },
  duration: 'PT10H0M',
  cabin: 'ECONOMY' as const,
};

function makeOffer(overrides: Partial<FlightOffer> & { price?: Partial<FlightOffer['price']>; outbound?: Partial<FlightOffer['outbound']> } = {}): FlightOffer {
  const { outbound: outboundOverrides, price: priceOverrides, ...rest } = overrides;
  return {
    id: 'test-1',
    provider: 'mock',
    validatingCarrier: 'AA',
    ...rest,
    outbound: {
      segments: [DEFAULT_SEGMENT],
      duration: 'PT10H0M',
      stops: 0,
      ...outboundOverrides,
    },
    price: {
      total: 500,
      currency: 'USD',
      ...priceOverrides,
    },
  };
}

const defaultPrefs: UserPreferences = {
  homeAirports: ['DFW'],
  preferredAirlines: ['AA'],
  preferredAlliances: [],
  maxStops: 1,
  maxLayoverMinutes: 240,
  currency: 'USD',
};

describe('parseDurationMinutes', () => {
  it('parses hours and minutes', () => {
    expect(parseDurationMinutes('PT2H30M')).toBe(150);
  });

  it('parses hours only', () => {
    expect(parseDurationMinutes('PT5H')).toBe(300);
  });

  it('parses minutes only', () => {
    expect(parseDurationMinutes('PT45M')).toBe(45);
  });

  it('returns 0 for invalid input', () => {
    expect(parseDurationMinutes('invalid')).toBe(0);
  });
});

describe('scoreOffers', () => {
  it('returns empty array for empty input', () => {
    expect(scoreOffers([], defaultPrefs)).toEqual([]);
  });

  it('scores and ranks offers', () => {
    const offers = [
      makeOffer({ id: 'expensive', price: { total: 900, currency: 'USD' } }),
      makeOffer({ id: 'cheap', price: { total: 300, currency: 'USD' } }),
      makeOffer({ id: 'mid', price: { total: 600, currency: 'USD' } }),
    ];

    const scored = scoreOffers(offers, defaultPrefs);
    expect(scored).toHaveLength(3);
    expect(scored[0].offer.id).toBe('cheap');
    expect(scored[scored.length - 1].offer.id).toBe('expensive');
  });

  it('favors nonstop flights', () => {
    const nonstop = makeOffer({
      id: 'nonstop',
      price: { total: 500, currency: 'USD' },
      outbound: {
        segments: [{ carrier: 'UA', carrierName: 'United', flightNumber: 'UA100', departure: { airport: 'DFW', at: '2026-09-05T08:00:00' }, arrival: { airport: 'CDG', at: '2026-09-05T22:00:00' }, duration: 'PT10H0M', cabin: 'ECONOMY' as const }],
        duration: 'PT10H0M',
        stops: 0,
      },
    });

    const oneStop = makeOffer({
      id: 'one-stop',
      price: { total: 500, currency: 'USD' },
      outbound: {
        segments: [
          { carrier: 'UA', carrierName: 'United', flightNumber: 'UA200', departure: { airport: 'DFW', at: '2026-09-05T08:00:00' }, arrival: { airport: 'ORD', at: '2026-09-05T12:00:00' }, duration: 'PT4H0M', cabin: 'ECONOMY' as const },
          { carrier: 'UA', carrierName: 'United', flightNumber: 'UA201', departure: { airport: 'ORD', at: '2026-09-05T14:00:00' }, arrival: { airport: 'CDG', at: '2026-09-06T04:00:00' }, duration: 'PT8H0M', cabin: 'ECONOMY' as const },
        ],
        duration: 'PT14H0M',
        stops: 1,
      },
    });

    const scored = scoreOffers([oneStop, nonstop], defaultPrefs);
    expect(scored[0].offer.id).toBe('nonstop');
  });

  it('includes card recommendation when card profile provided', () => {
    const card: CreditCard = {
      id: 'test-card',
      name: 'Test Card',
      issuer: 'Chase',
      network: 'Visa',
      annualFee: 95,
      categories: [{ category: 'travel', multiplier: 3 }],
      perks: [{ type: 'no_foreign_transaction_fee', description: 'No FTF' }],
    };

    const profile: UserCardProfile = {
      cards: [card],
      preferredPointValuation: { Chase: 1.5 },
    };

    const offers = [makeOffer()];
    const scored = scoreOffers(offers, defaultPrefs, profile);
    expect(scored[0].cardRecommendation).toBeDefined();
    expect(scored[0].cardRecommendation!.card.id).toBe('test-card');
    expect(scored[0].cardRecommendation!.estimatedRewardsValue).toBeGreaterThan(0);
  });

  it('score breakdown sums within expected range', () => {
    const offers = [makeOffer()];
    const scored = scoreOffers(offers, defaultPrefs);
    const { score } = scored[0];
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
