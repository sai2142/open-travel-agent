import type { FlightProvider, SearchRequest, SearchResult } from '@open-travel-agent/shared-types';
import { generateMockOffers } from './fixtures.js';

export class MockFlightProvider implements FlightProvider {
  readonly name = 'mock';

  async search(request: SearchRequest): Promise<SearchResult> {
    await this.simulateLatency();

    let offers = generateMockOffers(
      request.origin,
      request.destination,
      request.departureDate,
      request.returnDate,
      request.passengers,
    );

    if (request.directOnly) {
      offers = offers.filter((o) => o.outbound.stops === 0);
    }

    if (request.maxStops !== undefined) {
      offers = offers.filter((o) => o.outbound.stops <= request.maxStops!);
    }

    if (request.maxPrice !== undefined) {
      offers = offers.filter((o) => o.price.total <= request.maxPrice!);
    }

    return {
      request,
      offers,
      searchTimestamp: new Date().toISOString(),
      provider: this.name,
    };
  }

  private async simulateLatency(): Promise<void> {
    const ms = 200 + Math.random() * 300;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
