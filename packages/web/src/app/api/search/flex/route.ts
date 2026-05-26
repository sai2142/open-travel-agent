import { NextRequest, NextResponse } from 'next/server';
import type { FlightProvider, FlexibleSearchRequest, FlexSearchMode } from '@open-travel-agent/shared-types';
import { FlexibleSearchEngine, loadConfig } from '@open-travel-agent/agent-core';
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

    const flexRequest: FlexibleSearchRequest = {
      mode: body.mode as FlexSearchMode,
      origin: body.origin?.toUpperCase(),
      destination: body.destination?.toUpperCase(),
      passengers: body.passengers || 1,
      cabin: body.cabin || 'ECONOMY',
      maxStops: body.maxStops,
      maxPrice: body.maxPrice,
      directOnly: body.directOnly || false,
      preferredAirlines: body.preferredAirlines,
      currency: body.currency || 'USD',
      departureDate: body.departureDate,
      returnDate: body.returnDate,
      flexDays: body.flexDays,
      targetMonth: body.targetMonth,
      tripLengthMin: body.tripLengthMin,
      tripLengthMax: body.tripLengthMax,
      maxCombinations: body.maxCombinations || 30,
      concurrencyLimit: body.concurrencyLimit || 3,
    };

    const provider = getProvider();
    const engine = new FlexibleSearchEngine(provider);
    const result = await engine.search(flexRequest);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Flex search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
