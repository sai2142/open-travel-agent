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

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Set it in .env or environment.' },
        { status: 500 },
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse query' }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
