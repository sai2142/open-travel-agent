import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a flight search query parser. Given a natural language query about flights, extract structured search parameters.

Today's date is ${new Date().toISOString().split('T')[0]}.

Return ONLY valid JSON with these fields (omit fields that aren't mentioned):
{
  "origin": "IATA code (3 letters)",
  "destination": "IATA code (3 letters)",
  "mode": "exact" | "date-flex" | "weekend" | "trip-length",
  "departureDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD",
  "flexDays": number (1-7),
  "weekendMonth": "YYYY-MM",
  "tripLengthMin": number,
  "tripLengthMax": number,
  "passengers": number,
  "cabin": "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
  "directOnly": boolean
}

Rules:
- Convert city names to IATA airport codes (Dallas=DFW, London=LHR, Paris=CDG, New York=JFK, Columbus OH=CMH, Chicago=ORD, Los Angeles=LAX, San Francisco=SFO, Miami=MIA, Atlanta=ATL, Seattle=SEA, Boston=BOS, Denver=DEN, Tokyo=NRT, Rome=FCO, etc.)
- "flexible" or "±N days" → mode "date-flex" with flexDays
- "weekend" or "Fri-Sun" → mode "weekend" with weekendMonth
- "N to M day trip" or "N-M days" → mode "trip-length" with tripLengthMin and tripLengthMax
- "next month" → compute the actual YYYY-MM
- "nonstop" or "direct" → directOnly: true
- "business class" → cabin: "BUSINESS"
- Default to round-trip with return 7 days after departure if not specified
- If only a month is mentioned, use the 15th as departure date
- Return ONLY the JSON object, no explanation`;

const IATA_RE = /^[A-Z]{3,4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const VALID_MODES = new Set(['exact', 'date-flex', 'weekend', 'trip-length']);
const VALID_CABINS = new Set(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);

function sanitizeParsed(raw: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  if (typeof raw.origin === 'string' && IATA_RE.test(raw.origin)) clean.origin = raw.origin;
  if (typeof raw.destination === 'string' && IATA_RE.test(raw.destination)) clean.destination = raw.destination;
  if (typeof raw.mode === 'string' && VALID_MODES.has(raw.mode)) clean.mode = raw.mode;
  if (typeof raw.departureDate === 'string' && DATE_RE.test(raw.departureDate)) clean.departureDate = raw.departureDate;
  if (typeof raw.returnDate === 'string' && DATE_RE.test(raw.returnDate)) clean.returnDate = raw.returnDate;
  if (typeof raw.weekendMonth === 'string' && MONTH_RE.test(raw.weekendMonth)) clean.weekendMonth = raw.weekendMonth;
  if (typeof raw.cabin === 'string' && VALID_CABINS.has(raw.cabin)) clean.cabin = raw.cabin;
  if (typeof raw.directOnly === 'boolean') clean.directOnly = raw.directOnly;

  const flexDays = Number(raw.flexDays);
  if (Number.isFinite(flexDays) && flexDays >= 1 && flexDays <= 7) clean.flexDays = flexDays;

  const passengers = Number(raw.passengers);
  if (Number.isInteger(passengers) && passengers >= 1 && passengers <= 9) clean.passengers = passengers;

  const tripMin = Number(raw.tripLengthMin);
  if (Number.isInteger(tripMin) && tripMin >= 1 && tripMin <= 30) clean.tripLengthMin = tripMin;

  const tripMax = Number(raw.tripLengthMax);
  if (Number.isInteger(tripMax) && tripMax >= 1 && tripMax <= 30) clean.tripLengthMax = tripMax;

  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query || query.length > 500) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Natural language search is not configured' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not understand your request. Try rephrasing.' }, { status: 422 });
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Could not parse the response. Try rephrasing.' }, { status: 422 });
    }

    const sanitized = sanitizeParsed(raw);
    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('Parse route error:', err);
    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev && err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
