import { NextRequest, NextResponse } from 'next/server';
import type { SearchRequest, FlightProvider } from '@open-travel-agent/shared-types';
import { scoreOffers, buildCardProfile, defaultPreferences, loadConfig } from '@open-travel-agent/agent-core';
import { MockFlightProvider } from '@open-travel-agent/provider-mock';
import { DuffelFlightProvider } from '@open-travel-agent/provider-duffel';

const IATA_RE = /^[A-Z]{3,4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_CABINS = new Set(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);

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

function validate(body: Record<string, unknown>): string | null {
  const origin = String(body.origin || '').toUpperCase();
  const destination = String(body.destination || '').toUpperCase();
  if (!IATA_RE.test(origin)) return 'Invalid origin airport code';
  if (!IATA_RE.test(destination)) return 'Invalid destination airport code';
  if (!body.departureDate || !DATE_RE.test(String(body.departureDate)))
    return 'Invalid departure date (expected YYYY-MM-DD)';
  if (body.returnDate && !DATE_RE.test(String(body.returnDate)))
    return 'Invalid return date (expected YYYY-MM-DD)';
  if (body.cabin && !VALID_CABINS.has(String(body.cabin)))
    return 'Invalid cabin class';
  const passengers = Number(body.passengers || 1);
  if (passengers < 1 || passengers > 9) return 'Passengers must be 1-9';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { cardIds, ...searchParams } = body;

    const request: SearchRequest = {
      tripType: searchParams.returnDate ? 'round-trip' : 'one-way',
      origin: String(searchParams.origin).toUpperCase(),
      destination: String(searchParams.destination).toUpperCase(),
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,
      passengers: Number(searchParams.passengers) || 1,
      cabin: searchParams.cabin || 'ECONOMY',
      maxStops: searchParams.maxStops != null ? Number(searchParams.maxStops) : undefined,
      maxPrice: searchParams.maxPrice != null ? Number(searchParams.maxPrice) : undefined,
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
