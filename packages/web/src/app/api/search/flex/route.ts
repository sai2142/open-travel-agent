import { NextRequest, NextResponse } from 'next/server';
import type { FlightProvider, FlexibleSearchRequest, FlexSearchMode } from '@open-travel-agent/shared-types';
import { FlexibleSearchEngine, loadConfig } from '@open-travel-agent/agent-core';
import { MockFlightProvider } from '@open-travel-agent/provider-mock';
import { DuffelFlightProvider } from '@open-travel-agent/provider-duffel';

const IATA_RE = /^[A-Z]{3,4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const VALID_MODES = new Set(['exact', 'date-flex', 'weekend', 'trip-length']);

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
  if (!body.mode || !VALID_MODES.has(String(body.mode)))
    return 'Invalid search mode';
  const origin = String(body.origin || '').toUpperCase();
  const destination = String(body.destination || '').toUpperCase();
  if (!IATA_RE.test(origin)) return 'Invalid origin airport code';
  if (!IATA_RE.test(destination)) return 'Invalid destination airport code';
  const passengers = Number(body.passengers || 1);
  if (passengers < 1 || passengers > 9) return 'Passengers must be 1-9';
  const maxCombinations = Number(body.maxCombinations || 30);
  if (maxCombinations > 100) return 'maxCombinations cannot exceed 100';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const flexRequest: FlexibleSearchRequest = {
      mode: body.mode as FlexSearchMode,
      origin: String(body.origin).toUpperCase(),
      destination: String(body.destination).toUpperCase(),
      passengers: Number(body.passengers) || 1,
      cabin: body.cabin || 'ECONOMY',
      maxStops: body.maxStops != null ? Number(body.maxStops) : undefined,
      maxPrice: body.maxPrice != null ? Number(body.maxPrice) : undefined,
      directOnly: body.directOnly || false,
      preferredAirlines: body.preferredAirlines,
      currency: body.currency || 'USD',
      departureDate: body.departureDate,
      returnDate: body.returnDate,
      flexDays: body.flexDays != null ? Number(body.flexDays) : undefined,
      targetMonth: body.targetMonth,
      tripLengthMin: body.tripLengthMin != null ? Number(body.tripLengthMin) : undefined,
      tripLengthMax: body.tripLengthMax != null ? Number(body.tripLengthMax) : undefined,
      maxCombinations: Math.min(Number(body.maxCombinations) || 30, 100),
      concurrencyLimit: Math.min(Number(body.concurrencyLimit) || 3, 5),
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
