import type {
  FlightProvider,
  SearchRequest,
  SearchResult,
  FlexibleSearchRequest,
  DatePair,
  DateGridCell,
  DateGridResult,
  FlexibleSearchProgress,
} from '@open-travel-agent/shared-types';

export interface FlexibleSearchOptions {
  concurrency?: number;
  maxCombinations?: number;
  cacheTtlMs?: number;
  onProgress?: (progress: FlexibleSearchProgress) => void;
}

interface CacheEntry {
  result: SearchResult;
  expiresAt: number;
}

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_COMBINATIONS = 30;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class FlexibleSearchEngine {
  private provider: FlightProvider;
  private cache = new Map<string, CacheEntry>();
  private concurrency: number;
  private maxCombinations: number;
  private cacheTtlMs: number;
  private onProgress?: (progress: FlexibleSearchProgress) => void;

  constructor(provider: FlightProvider, options?: FlexibleSearchOptions) {
    this.provider = provider;
    this.concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
    this.maxCombinations = options?.maxCombinations ?? DEFAULT_MAX_COMBINATIONS;
    this.cacheTtlMs = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.onProgress = options?.onProgress;
  }

  async search(request: FlexibleSearchRequest): Promise<DateGridResult> {
    const concurrency = request.concurrencyLimit ?? this.concurrency;
    const maxCombos = request.maxCombinations ?? this.maxCombinations;
    const cacheTtl = request.cacheTtlMs ?? this.cacheTtlMs;

    let datePairs = generateDatePairs(request);
    if (datePairs.length > maxCombos) {
      datePairs = datePairs.slice(0, maxCombos);
    }

    const startTime = Date.now();
    const cells: DateGridCell[] = [];
    let totalOffers = 0;
    let cachedHits = 0;

    const queue = [...datePairs];
    let completed = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const pair = queue.shift()!;
        const cacheKey = this.buildCacheKey(request.origin, request.destination, pair);
        const cached = this.getFromCache(cacheKey, cacheTtl);

        let result: SearchResult;
        if (cached) {
          result = cached;
          cachedHits++;
        } else {
          const searchReq = this.buildSearchRequest(pair, request);
          result = await this.provider.search(searchReq);
          this.setCache(cacheKey, result, cacheTtl);
        }

        if (result.offers.length > 0) {
          const sorted = [...result.offers].sort((a, b) => a.price.total - b.price.total);
          cells.push({
            datePair: pair,
            bestPrice: sorted[0].price.total,
            bestOffer: sorted[0],
            offerCount: sorted.length,
          });
          totalOffers += result.offers.length;
        }

        completed++;
        this.onProgress?.({
          completed,
          total: datePairs.length,
          currentPair: pair,
        });
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, datePairs.length) }, () => worker());
    await Promise.all(workers);

    cells.sort((a, b) => a.bestPrice - b.bestPrice);

    return {
      request,
      cells,
      bestOverall: cells[0] ?? null,
      searchedCombinations: datePairs.length,
      totalOffersFound: totalOffers,
      searchDurationMs: Date.now() - startTime,
      cachedHits,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private buildSearchRequest(pair: DatePair, flex: FlexibleSearchRequest): SearchRequest {
    return {
      tripType: pair.returnDate ? 'round-trip' : 'one-way',
      origin: flex.origin,
      destination: flex.destination,
      departureDate: pair.departureDate,
      returnDate: pair.returnDate,
      passengers: flex.passengers,
      cabin: flex.cabin,
      maxStops: flex.maxStops,
      maxPrice: flex.maxPrice,
      directOnly: flex.directOnly,
      preferredAirlines: flex.preferredAirlines,
      currency: flex.currency,
    };
  }

  private buildCacheKey(origin: string, dest: string, pair: DatePair): string {
    return `${origin}-${dest}-${pair.departureDate}-${pair.returnDate ?? 'ow'}`;
  }

  private getFromCache(key: string, ttl: number): SearchResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.result;
  }

  private setCache(key: string, result: SearchResult, ttl: number): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + ttl,
    });
  }
}

// --- Date pair generators ---

export function generateDatePairs(request: FlexibleSearchRequest): DatePair[] {
  switch (request.mode) {
    case 'exact':
      return [{ departureDate: request.departureDate!, returnDate: request.returnDate }];
    case 'date-flex':
      return generateDateFlexPairs(
        request.departureDate!,
        request.returnDate,
        request.flexDays ?? 2,
      );
    case 'weekend':
      return generateWeekendPairs(request.targetMonth!);
    case 'trip-length':
      return generateTripLengthPairs(
        request.targetMonth!,
        request.tripLengthMin ?? 3,
        request.tripLengthMax ?? 5,
      );
    default:
      return [{ departureDate: request.departureDate!, returnDate: request.returnDate }];
  }
}

export function generateDateFlexPairs(
  baseDeparture: string,
  baseReturn: string | undefined,
  flexDays: number,
): DatePair[] {
  const pairs: DatePair[] = [];
  const baseDepDate = parseDate(baseDeparture);

  if (!baseReturn) {
    for (let d = -flexDays; d <= flexDays; d++) {
      const dep = addDays(baseDepDate, d);
      pairs.push({ departureDate: formatDate(dep) });
    }
    return pairs;
  }

  const baseRetDate = parseDate(baseReturn);
  for (let d = -flexDays; d <= flexDays; d++) {
    for (let r = -flexDays; r <= flexDays; r++) {
      const dep = addDays(baseDepDate, d);
      const ret = addDays(baseRetDate, r);
      if (ret > dep) {
        pairs.push({
          departureDate: formatDate(dep),
          returnDate: formatDate(ret),
        });
      }
    }
  }
  return pairs;
}

export function generateWeekendPairs(targetMonth: string): DatePair[] {
  const [year, month] = targetMonth.split('-').map(Number);
  const pairs: DatePair[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    // Friday = 5
    if (date.getDay() === 5) {
      const friday = new Date(year, month - 1, day);
      const sunday = addDays(friday, 2);
      pairs.push({
        departureDate: formatDate(friday),
        returnDate: formatDate(sunday),
      });
    }
  }
  return pairs;
}

export function generateTripLengthPairs(
  targetMonth: string,
  minDays: number,
  maxDays: number,
): DatePair[] {
  const [year, month] = targetMonth.split('-').map(Number);
  const pairs: DatePair[] = [];
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const depDate = new Date(year, month - 1, day);
    for (let len = minDays; len <= maxDays; len++) {
      const retDate = addDays(depDate, len);
      // Allow return dates to spill into the next month
      pairs.push({
        departureDate: formatDate(depDate),
        returnDate: formatDate(retDate),
      });
    }
  }
  return pairs;
}

// --- Date helpers ---

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
