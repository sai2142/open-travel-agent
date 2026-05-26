import type { CabinClass, FlightOffer } from './flight.js';

export type FlexSearchMode = 'exact' | 'date-flex' | 'weekend' | 'trip-length';

export interface DatePair {
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD
}

export interface FlexibleSearchRequest {
  mode: FlexSearchMode;
  origin: string;
  destination: string;
  passengers: number;
  cabin?: CabinClass;
  maxStops?: number;
  maxPrice?: number;
  directOnly?: boolean;
  preferredAirlines?: string[];
  currency?: string;

  // exact / date-flex
  departureDate?: string;  // YYYY-MM-DD base departure
  returnDate?: string;     // YYYY-MM-DD base return
  flexDays?: number;       // ±N days (date-flex mode)

  // weekend
  targetMonth?: string;    // YYYY-MM

  // trip-length
  tripLengthMin?: number;  // min days
  tripLengthMax?: number;  // max days

  // cost controls
  maxCombinations?: number;
  concurrencyLimit?: number;
  cacheTtlMs?: number;
}

export interface DateGridCell {
  datePair: DatePair;
  bestPrice: number;
  bestOffer: FlightOffer;
  offerCount: number;
}

export interface DateGridResult {
  request: FlexibleSearchRequest;
  cells: DateGridCell[];
  bestOverall: DateGridCell | null;
  searchedCombinations: number;
  totalOffersFound: number;
  searchDurationMs: number;
  cachedHits: number;
}

export interface FlexibleSearchProgress {
  completed: number;
  total: number;
  currentPair: DatePair;
}
