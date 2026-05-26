# Duffel Provider — Integration Plan

## Why Duffel

Amadeus Self-Service APIs are being decommissioned for new developer signups. Duffel provides:
- Modern REST/JSON API with clear versioning (`Duffel-Version: v2`)
- Sandbox environment with realistic test data (no credit card required)
- Coverage across 300+ airlines via NDC and GDS sources
- Simple bearer-token auth (no OAuth client-credentials dance)
- Generous free tier: 1,000 offer requests/month on sandbox

## Signup Flow

1. Create account at https://app.duffel.com/join
2. Navigate to Developers > Access tokens
3. Create a **test** token (prefix `duffel_test_...`)
4. Set `DUFFEL_ACCESS_TOKEN=duffel_test_...` in `.env`
5. For production, create a **live** token (`duffel_live_...`) and set `DUFFEL_ENV=production`

## API Workflow

Duffel search is a **two-step** process, but can be done synchronously:

### Step 1: Create Offer Request
```
POST /air/offer_requests
Authorization: Bearer {token}
Duffel-Version: v2

{
  "data": {
    "slices": [
      { "origin": "DFW", "destination": "CDG", "departure_date": "2026-09-05" },
      { "origin": "CDG", "destination": "DFW", "departure_date": "2026-09-12" }
    ],
    "passengers": [{ "type": "adult" }],
    "cabin_class": "economy",
    "return_offers": true
  }
}
```

When `return_offers: true`, the response blocks and returns offers inline (~5-15s).

### Step 2: Read Offers (alternative async flow)
If `return_offers: false`, poll:
```
GET /air/offers?offer_request_id={id}&limit=50
```

For v1, we use the synchronous path for simplicity.

## Field Mapping: Duffel → Normalized Schema

| Duffel field | Our field | Notes |
|---|---|---|
| `offer.id` | `FlightOffer.id` | |
| `offer.total_amount` | `Price.total` | String → number |
| `offer.total_currency` | `Price.currency` | |
| `offer.base_amount` | `Price.base` | |
| `offer.tax_amount` | `Price.taxes` | |
| `offer.owner.iata_code` | `FlightOffer.validatingCarrier` | |
| `offer.slices[0]` | `FlightOffer.outbound` | First slice = outbound |
| `offer.slices[1]` | `FlightOffer.inbound` | Second slice = return |
| `slice.segments[]` | `Itinerary.segments[]` | |
| `slice.duration` | `Itinerary.duration` | ISO 8601 |
| `segment.marketing_carrier.iata_code` | `FlightSegment.carrier` | |
| `segment.marketing_carrier.name` | `FlightSegment.carrierName` | |
| `segment.marketing_carrier_flight_number` | Part of `FlightSegment.flightNumber` | Prepend carrier code |
| `segment.origin.iata_code` | `departure.airport` | |
| `segment.destination.iata_code` | `arrival.airport` | |
| `segment.departing_at` | `departure.at` | ISO 8601 |
| `segment.arriving_at` | `arrival.at` | ISO 8601 |
| `segment.duration` | `FlightSegment.duration` | ISO 8601 |
| `segment.aircraft.iata_code` | `FlightSegment.aircraft` | |

## TODO — Remaining Implementation Work

- [ ] Verify Duffel SDK types vs raw fetch (we use raw fetch for fewer deps; `@duffel/api` is optional)
- [ ] Handle Duffel pagination (offers may exceed one page for broad searches)
- [ ] Apply client-side `maxPrice` filter (Duffel has no server-side price filter)
- [ ] Apply client-side `directOnly` filter → map to `max_connections: 0` in slice request
- [ ] Handle multi-city: each leg becomes a separate slice in the offer request
- [ ] Compute total itinerary duration from segment durations if slice-level `duration` is missing
- [ ] Map `fare_brand_name` → CabinClass more robustly (varies by airline)
- [ ] Generate booking deeplinks (Duffel doesn't return airline booking URLs directly)
- [ ] Add rate-limit handling (429 responses) with exponential backoff
- [ ] Integration tests against Duffel sandbox with known routes

## Future: Kiwi/Tequila as Secondary Provider

Kiwi/Tequila may be added later for:
- Flexible date search (Duffel requires exact dates)
- Airport/city/location resolution (Kiwi has a strong locations API)
- Budget-oriented routing that Duffel's GDS sources may not surface

This would implement the same `FlightProvider` interface and be selectable via `--provider kiwi` flag.
