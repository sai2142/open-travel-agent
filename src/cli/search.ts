import { Command } from 'commander';
import ora from 'ora';
import type { SearchRequest, TripType, CabinClass, FlightProvider } from '@open-travel-agent/shared-types';
import { loadConfig, defaultPreferences, buildCardProfile, scoreOffers, formatRankedResults, formatBookingDetails, formatResultsJson, loadProfile } from '@open-travel-agent/agent-core';
import { MockFlightProvider } from '@open-travel-agent/provider-mock';
import { DuffelFlightProvider } from '@open-travel-agent/provider-duffel';
import { setLastSearchResults } from './book-cmd.js';

interface SearchFlags {
  from: string;
  to: string;
  depart: string;
  return?: string;
  tripType: TripType;
  passengers: number;
  cabin: CabinClass;
  maxStops?: number;
  maxPrice?: number;
  direct: boolean;
  airlines?: string;
  cards?: string;
  json: boolean;
  top: number;
  mock: boolean;
  book?: string;
}

export function createSearchCommand(): Command {
  return new Command('search')
    .description('Search for flights')
    .requiredOption('--from <code>', 'Origin airport code (e.g., DFW)')
    .requiredOption('--to <code>', 'Destination airport code (e.g., CDG)')
    .requiredOption('--depart <date>', 'Departure date (YYYY-MM-DD)')
    .option('--return <date>', 'Return date for round-trip (YYYY-MM-DD)')
    .option('--trip-type <type>', 'Trip type: one-way, round-trip', 'round-trip')
    .option('--passengers <n>', 'Number of passengers', '1')
    .option('--cabin <class>', 'Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST', 'ECONOMY')
    .option('--max-stops <n>', 'Maximum number of stops')
    .option('--max-price <amount>', 'Maximum price per person')
    .option('--direct', 'Nonstop flights only', false)
    .option('--airlines <codes>', 'Preferred airlines (comma-separated)')
    .option('--cards <ids>', 'Card IDs for rewards scoring (comma-separated, or uses saved profile)')
    .option('--json', 'Output results as JSON', false)
    .option('--top <n>', 'Number of results to show', '5')
    .option('--mock', 'Force mock provider (for testing)', false)
    .option('--book <number>', 'Immediately show booking details for result #N')
    .action(async (flags: SearchFlags) => {
      const config = loadConfig();
      const preferences = defaultPreferences(config);
      const profile = await loadProfile();

      const request: SearchRequest = {
        tripType: flags.return ? 'round-trip' : (flags.tripType as TripType),
        origin: flags.from.toUpperCase(),
        destination: flags.to.toUpperCase(),
        departureDate: flags.depart,
        returnDate: flags.return,
        passengers: Number(flags.passengers),
        cabin: flags.cabin as CabinClass,
        maxStops: flags.maxStops !== undefined ? Number(flags.maxStops) : undefined,
        maxPrice: flags.maxPrice !== undefined ? Number(flags.maxPrice) : undefined,
        directOnly: flags.direct,
        preferredAirlines: flags.airlines?.split(',').map((s) => s.trim().toUpperCase()),
        currency: config.defaultCurrency,
      };

      if (flags.airlines) {
        preferences.preferredAirlines = flags.airlines.split(',').map((s) => s.trim().toUpperCase());
      }

      let provider: FlightProvider;
      if (flags.mock || config.provider === 'mock') {
        provider = new MockFlightProvider();
      } else {
        if (!config.duffelToken) {
          console.error('Duffel API token not configured. Use --mock for testing or set DUFFEL_ACCESS_TOKEN.');
          process.exit(1);
        }
        provider = new DuffelFlightProvider({
          token: config.duffelToken,
          environment: config.duffelEnv,
        });
      }

      const spinner = ora('Searching flights...').start();

      try {
        const result = await provider.search(request);
        spinner.succeed(`Found ${result.offers.length} flights via ${result.provider}`);

        // Use --cards flag, or fall back to saved profile cards
        const cardIds = flags.cards
          ? flags.cards.split(',').map((s) => s.trim())
          : profile.cardIds;

        const cardProfile = cardIds.length > 0 ? buildCardProfile(cardIds) : undefined;
        const scored = scoreOffers(result.offers, preferences, cardProfile);

        setLastSearchResults(scored);

        if (flags.json) {
          console.log(formatResultsJson(scored, Number(flags.top)));
        } else {
          console.log(formatRankedResults(scored, Number(flags.top)));

          // If --book is passed, immediately show booking details
          if (flags.book) {
            const bookIdx = parseInt(flags.book, 10) - 1;
            if (bookIdx >= 0 && bookIdx < scored.length) {
              console.log(formatBookingDetails(scored[bookIdx]));
            }
          }
        }
      } catch (err) {
        spinner.fail('Search failed');
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
