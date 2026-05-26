import type { CabinClass } from './flight.js';

export interface UserPreferences {
  homeAirports: string[];
  preferredAirlines: string[];
  preferredAlliances: string[];
  maxStops: number;
  maxLayoverMinutes: number;
  preferredDepartureWindow?: { earliest: string; latest: string };
  preferredArrivalWindow?: { earliest: string; latest: string };
  currency: string;
}

export interface AppConfig {
  duffelToken?: string;
  duffelEnv: 'test' | 'production';
  anthropicApiKey?: string;
  defaultOrigin?: string;
  defaultCurrency: string;
  defaultCabin: CabinClass;
  provider: 'duffel' | 'mock';
}
