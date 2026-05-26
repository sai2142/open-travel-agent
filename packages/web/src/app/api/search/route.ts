import { NextRequest, NextResponse } from 'next/server';
import type { SearchRequest, FlightProvider } from '@open-travel-agent/shared-types';
import { scoreOffers, buildCardProfile, defaultPreferences, loadConfig } from '@open-travel-agent/agent-core';
import { MockFlightProvider } from '@open-travel-agent/provider-mock';
import { DuffelFlightProvider } from '@open-travel-agent/provider-duffel';

function getProvider(): FlightProvider {
  const config = loadConfig();
  if (config.duffelToken && config.provider !== 'mock') {
    return new DuffelFlightProvider({
      token: config.duffelToken,
      environment: config.duffelEnv,
    });
  }
  return new MockFlightProvider();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardIds, ...searchParams } = body;

    const request: SearchRequest = {
      tripType: searchParams.returnDate ? 'round-trip' : 'one-way',
      origin: searchParams.origin?.toUpperCase(),
      destination: searchParams.destination?.toUpperCase(),
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,
      passengers: searchParams.passengers || 1,
      cabin: searchParams.cabin || 'ECONOMY',
      maxStops: searchParams.maxStops,
      maxPrice: searchParams.maxPrice,
      directOnly: searchParams.directOnly || false,
      preferredAirlines: searchParams.preferredAirlines,
      currency: searchParams.currency || 'USD',
    };

    const provider = getProvider();
    const result = await provider.search(request);
    const config = loadConfig();
    const preferences = defaultPreferences(config);
    const cardProfile =
      cardIds && cardIds.length > 0 ? buildCardProfile(cardIds) : undefined;
    const scored = scoreOffers(result.offers, preferences, cardProfile);

    return NextResponse.json({
      offers: scored.slice(0, 20),
      totalOffers: result.offers.length,
      provider: result.provider,
      searchTimestamp: result.searchTimestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
