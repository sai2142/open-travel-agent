import { config as dotenvConfig } from 'dotenv';
import type { AppConfig, UserPreferences } from '@open-travel-agent/shared-types';

export function loadConfig(): AppConfig {
  dotenvConfig();

  return {
    duffelToken: process.env.DUFFEL_ACCESS_TOKEN,
    duffelEnv: (process.env.DUFFEL_ENV as 'test' | 'production') || 'test',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    defaultOrigin: process.env.DEFAULT_ORIGIN,
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    defaultCabin: (process.env.DEFAULT_CABIN as AppConfig['defaultCabin']) || 'ECONOMY',
    provider: process.env.DUFFEL_ACCESS_TOKEN ? 'duffel' : 'mock',
  };
}

export function defaultPreferences(config: AppConfig): UserPreferences {
  return {
    homeAirports: config.defaultOrigin ? [config.defaultOrigin] : [],
    preferredAirlines: [],
    preferredAlliances: [],
    maxStops: 2,
    maxLayoverMinutes: 240,
    currency: config.defaultCurrency,
  };
}
