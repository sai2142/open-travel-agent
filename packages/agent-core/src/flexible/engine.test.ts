import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlexibleSearchEngine, generateDatePairs, generateDateFlexPairs, generateWeekendPairs, generateTripLengthPairs } from './engine.js';
import { MockFlightProvider } from '@open-travel-agent/provider-mock';
import type { FlexibleSearchRequest } from '@open-travel-agent/shared-types';

describe('generateDateFlexPairs', () => {
  it('generates one-way flex pairs', () => {
    const pairs = generateDateFlexPairs('2026-07-10', undefined, 2);
    expect(pairs).toHaveLength(5); // -2, -1, 0, +1, +2
    expect(pairs[0].departureDate).toBe('2026-07-08');
    expect(pairs[2].departureDate).toBe('2026-07-10');
    expect(pairs[4].departureDate).toBe('2026-07-12');
    expect(pairs[0].returnDate).toBeUndefined();
  });

  it('generates round-trip flex pairs', () => {
    const pairs = generateDateFlexPairs('2026-07-10', '2026-07-13', 1);
    // dep: 9,10,11  x  ret: 12,13,14 — but only where ret > dep
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.returnDate).toBeDefined();
      expect(p.returnDate! > p.departureDate).toBe(true);
    }
  });

  it('filters out invalid pairs where return <= departure', () => {
    const pairs = generateDateFlexPairs('2026-07-10', '2026-07-10', 1);
    for (const p of pairs) {
      if (p.returnDate) {
        expect(p.returnDate > p.departureDate).toBe(true);
      }
    }
  });

  it('handles flex=0 as exact', () => {
    const pairs = generateDateFlexPairs('2026-07-10', '2026-07-13', 0);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].departureDate).toBe('2026-07-10');
    expect(pairs[0].returnDate).toBe('2026-07-13');
  });
});

describe('generateWeekendPairs', () => {
  it('finds all Fridays in a month', () => {
    const pairs = generateWeekendPairs('2026-08');
    expect(pairs.length).toBeGreaterThanOrEqual(4);
    for (const p of pairs) {
      const depDate = new Date(p.departureDate + 'T00:00:00');
      expect(depDate.getDay()).toBe(5); // Friday
      expect(p.returnDate).toBeDefined();
      const retDate = new Date(p.returnDate! + 'T00:00:00');
      expect(retDate.getDay()).toBe(0); // Sunday
    }
  });

  it('returns empty for a month with no Fridays starting on day 1', () => {
    // Every month has at least 4 Fridays, so this always has results
    const pairs = generateWeekendPairs('2026-07');
    expect(pairs.length).toBeGreaterThanOrEqual(4);
  });
});

describe('generateTripLengthPairs', () => {
  it('generates pairs for each day x each trip length', () => {
    const pairs = generateTripLengthPairs('2026-08', 3, 5);
    // 31 days x 3 lengths (3,4,5) = 93
    expect(pairs).toHaveLength(93);
  });

  it('departure dates are within the target month', () => {
    const pairs = generateTripLengthPairs('2026-08', 3, 3);
    for (const p of pairs) {
      expect(p.departureDate.startsWith('2026-08')).toBe(true);
    }
  });

  it('return dates can extend past the month boundary', () => {
    const pairs = generateTripLengthPairs('2026-08', 5, 5);
    const lastPair = pairs[pairs.length - 1];
    // Aug 31 + 5 = Sep 5
    expect(lastPair.departureDate).toBe('2026-08-31');
    expect(lastPair.returnDate).toBe('2026-09-05');
  });

  it('handles single-day trip length', () => {
    const pairs = generateTripLengthPairs('2026-08', 1, 1);
    expect(pairs).toHaveLength(31);
    for (const p of pairs) {
      const dep = new Date(p.departureDate + 'T00:00:00');
      const ret = new Date(p.returnDate! + 'T00:00:00');
      const diff = (ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBe(1);
    }
  });
});

describe('generateDatePairs', () => {
  it('exact mode returns single pair', () => {
    const pairs = generateDatePairs({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
      returnDate: '2026-07-13',
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ departureDate: '2026-07-10', returnDate: '2026-07-13' });
  });

  it('date-flex mode uses flexDays', () => {
    const pairs = generateDatePairs({
      mode: 'date-flex',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
      flexDays: 1,
    });
    expect(pairs).toHaveLength(3);
  });

  it('weekend mode delegates to weekendPairs', () => {
    const pairs = generateDatePairs({
      mode: 'weekend',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      targetMonth: '2026-08',
    });
    expect(pairs.length).toBeGreaterThanOrEqual(4);
  });

  it('trip-length mode uses min/max', () => {
    const pairs = generateDatePairs({
      mode: 'trip-length',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      targetMonth: '2026-08',
      tripLengthMin: 3,
      tripLengthMax: 4,
    });
    // 31 days x 2 lengths = 62
    expect(pairs).toHaveLength(62);
  });
});

describe('FlexibleSearchEngine', () => {
  let provider: MockFlightProvider;

  beforeEach(() => {
    provider = new MockFlightProvider();
  });

  it('searches exact dates', async () => {
    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
      returnDate: '2026-07-13',
    });

    expect(result.searchedCombinations).toBe(1);
    expect(result.cells.length).toBeGreaterThan(0);
    expect(result.bestOverall).not.toBeNull();
    expect(result.bestOverall!.bestPrice).toBeGreaterThan(0);
  });

  it('searches flexible dates and finds best price', async () => {
    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search({
      mode: 'date-flex',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
      returnDate: '2026-07-13',
      flexDays: 1,
    });

    expect(result.searchedCombinations).toBeGreaterThan(1);
    expect(result.cells.length).toBeGreaterThan(0);
    // Cells should be sorted by price
    for (let i = 1; i < result.cells.length; i++) {
      expect(result.cells[i].bestPrice).toBeGreaterThanOrEqual(result.cells[i - 1].bestPrice);
    }
  });

  it('searches weekends in a month', async () => {
    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search({
      mode: 'weekend',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      targetMonth: '2026-08',
    });

    expect(result.searchedCombinations).toBeGreaterThanOrEqual(4);
    expect(result.cells.length).toBeGreaterThan(0);
  });

  it('respects maxCombinations limit', async () => {
    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search({
      mode: 'trip-length',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      targetMonth: '2026-08',
      tripLengthMin: 3,
      tripLengthMax: 5,
      maxCombinations: 5,
    });

    expect(result.searchedCombinations).toBe(5);
  });

  it('uses cache for duplicate date pairs', async () => {
    const searchSpy = vi.spyOn(provider, 'search');
    const engine = new FlexibleSearchEngine(provider);

    // Search the same dates twice
    await engine.search({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
    });

    const result2 = await engine.search({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
    });

    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(result2.cachedHits).toBe(1);
  });

  it('reports progress callbacks', async () => {
    const progressUpdates: number[] = [];
    const engine = new FlexibleSearchEngine(provider, {
      onProgress: (p) => progressUpdates.push(p.completed),
    });

    await engine.search({
      mode: 'date-flex',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
      flexDays: 1,
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(3);
  });

  it('handles empty results gracefully', async () => {
    vi.spyOn(provider, 'search').mockResolvedValue({
      request: {} as any,
      offers: [],
      searchTimestamp: new Date().toISOString(),
      provider: 'mock',
    });

    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search({
      mode: 'date-flex',
      origin: 'DFW',
      destination: 'XXX',
      passengers: 1,
      departureDate: '2026-07-10',
      flexDays: 1,
    });

    expect(result.cells).toHaveLength(0);
    expect(result.bestOverall).toBeNull();
    expect(result.totalOffersFound).toBe(0);
  });

  it('clearCache removes all entries', async () => {
    const searchSpy = vi.spyOn(provider, 'search');
    const engine = new FlexibleSearchEngine(provider);

    await engine.search({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
    });

    engine.clearCache();

    await engine.search({
      mode: 'exact',
      origin: 'DFW',
      destination: 'CMH',
      passengers: 1,
      departureDate: '2026-07-10',
    });

    expect(searchSpy).toHaveBeenCalledTimes(2);
  });
});
