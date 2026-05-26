# Product Requirements Document: Open Travel Agent CLI

## 1. Product Summary

**Working name:** Open Travel Agent CLI
**Type:** Open-source AI agent (CLI-first)
**Primary purpose:** Conversational tool for frequent travelers that searches flights across providers, optimizes for user preferences plus credit card perks, and outputs "ready-to-book" itineraries (but does not complete bookings itself).

The agent:
- Parses natural language travel intents (e.g., "DFW to CDG over Labor Day, only nonstops").
- Searches flights via **Duffel** (live prices and availability across 300+ airlines via NDC and GDS sources).
- Scores options based on price, duration, layovers, and a rule-based understanding of the user's credit card rewards and perks.
- Presents a ranked short list with rationale and booking links, plus auto-filled passenger data ready to paste into airline/OTA checkout.
- Stores passport, KTN, and loyalty IDs in a local encrypted vault, not on any server.

> **Historical note:** The original PRD specified Amadeus Self-Service APIs as the primary provider. Amadeus Self-Service is being decommissioned and new developer signup is no longer viable. Duffel replaces Amadeus as the v1 flight search provider.

## 2. Goals and Non-Goals

### Goals (v1)
- Provide an AI-powered CLI agent that:
  - Searches and ranks flights across trip types: one-way, round-trip, multi-city.
  - Uses **Duffel** as the primary real provider for scalable flight search.
  - Applies rule-based credit card perk logic to highlight the best payment method per itinerary.
  - Stores PII (passport, KTN, loyalty numbers) locally in an encrypted vault and uses it to generate "ready to paste" passenger details.
  - Outputs human-readable, copy-pasteable booking instructions and airline/OTA links, not actual bookings.
- Make the project:
  - Easy to install and run for other developers (clean README, env example, Docker).
  - Architected for future extension (providers, frontends) without major rewrites.

### Non-Goals (v1)
- No direct booking or ticketing (no PNR creation, no payment processing).
- No hotels, cars, or vacation rentals (these are future phases).
- No multi-tenant hosted SaaS in v1; focus on local CLI and local vault.
- No live issuer reward redemption APIs (rule-based modeling only).

## 3. Target Users

**Primary:**
- Frequent travelers and points enthusiasts who regularly compare flights and hold multiple rewards cards.
- Technical users (developers, security-conscious users) who prefer CLI tools and local-first PII.

**Secondary:**
- Developers who want a reusable, open-source travel-agent core they can embed into their own apps.

## 4. Core User Stories (MVP)

1. **Search & rank flights** — Type a natural-language request and see ranked results with prices, durations, and layovers.
2. **Trip type flexibility** — Specify one-way, round-trip, or multi-city trips.
3. **Rewards-aware recommendations** — Agent knows your cards and suggests the best one per itinerary.
4. **Identity-aware details** — Passport, KTN, and loyalty numbers securely stored and auto-filled.
5. **Ready-to-book output** — Itinerary details, booking links, passenger data, and card recommendation.
6. **Local privacy and encryption** — All PII stored locally in an encrypted vault.

## 5. Functional Requirements (v1)

### 5.1 CLI Interface
- `travel-agent init` — setup wizard (API keys, cards, preferences, vault master password).
- `travel-agent search` — interactive or flag-based search.
- `travel-agent profile` — manage preferences and cards.
- `travel-agent vault` — add/update passport, KTN, loyalty IDs.
- `travel-agent cards` — list available credit cards for rewards scoring.

### 5.2 Flight Search & Normalization
- **Primary provider: Duffel**
  - Bearer-token auth (no OAuth dance).
  - Offer Request + Offer retrieval workflow (synchronous mode with `return_offers: true`).
  - Support: one-way, round-trip, multi-city; cabin classes; passenger counts.
  - Normalize Duffel responses into internal `FlightOffer` schema.
- **Mock provider** for development and testing, with fixtures.
- **Provider abstraction** via `FlightProvider` interface — future providers (Kiwi/Tequila, Travelport) implement the same interface.

### 5.3 Scoring & Ranking Engine
- Weighted scoring: `Score = f(price, duration, stops, departure/arrival time alignment, airline preference, estimated reward value)`.
- Weights: price 35%, duration 25%, stops 20%, time 10%, airline 5%, rewards 5%.
- Card/reward modeling per card: category multipliers, travel perks, estimated rewards value.
- Output: ranked list with top 3-10 options, recommended card and rationale for each.

### 5.4 Rewards & Perks Data
- Local JSON card metadata store with 6 popular travel cards built in.
- CLI command `travel-agent cards sync` to refresh card/perk data (future).
- No live issuer integration in v1.

### 5.5 Identity Vault
- Vault contents: passport, KTN, redress number, frequent flyer numbers.
- AES-256-GCM encryption with Argon2id key derivation.
- Locked/cleared from memory after CLI exit.
- No remote PII storage in v1.

### 5.6 Ready-to-Book Handoff
- For any chosen itinerary: summary, booking context, passenger data (masked for display), recommended card.
- Human-readable text (default) or JSON (`--json` flag).
- No actual booking or payment APIs in v1.

## 6. Non-Functional Requirements

### 6.1 Security & Privacy
- PII never transmitted to any server by default.
- API tokens loaded from env vars, never hardcoded.
- CLI logs do not log PII or secrets.
- `--debug` mode redacts sensitive values.

### 6.2 Performance
- Flight search: return results within ~5-15 seconds (subject to Duffel latency).
- Scoring: rank up to a few hundred itineraries in under 500ms.
- CLI shows progress indicators for slow network calls.

### 6.3 Reliability
- Graceful error messages when Duffel or external APIs fail.
- Fallback to mock provider in dev/test mode.

### 6.4 Open-Source Usability
- Clear README, docs/ folder, .env.example, Docker support.

## 7. Technical Architecture

- **Language:** TypeScript
- **Runtime:** Node.js >= 20
- **Structure:** npm workspaces monorepo
  - `packages/shared-types` — normalized schemas, `FlightProvider` interface
  - `packages/agent-core` — scoring, vault, config, output
  - `packages/provider-duffel` — Duffel API integration
  - `packages/provider-mock` — mock provider for testing
  - `src/` — CLI entry point (root package)
- **CLI:** commander
- **Testing:** vitest

## 8. Dependencies & External Services

- **Duffel API** — primary flight search provider (sandbox is free, 1,000 requests/month).
- **LLM provider (Claude API)** — for NL parsing and reasoning (future milestone).
- **Static JSON** — for card perks data (bundled in agent-core).

## 9. Milestones

### M1: Project Setup & Mock Search (DONE)
- Monorepo scaffold with npm workspaces.
- Normalized flight/card/vault type schemas.
- Mock flight provider with sample itineraries.
- Scoring engine (price/duration/stops/time/airline/rewards).
- CLI skeleton with search, cards, vault commands.
- Unit tests (23 passing).

### M2: Duffel Integration
- Environment config for Duffel token.
- Real flight search via Duffel Offer Request API.
- Response normalization into `FlightOffer` schema.
- Client-side filtering (maxPrice, directOnly).
- Integration tests against Duffel sandbox.

### M3: Rewards-Aware Scoring
- Expand card metadata store.
- Card sync command.
- Enhanced explanations in CLI output.

### M4: Identity Vault & Ready-to-Book Output
- Encrypted local vault for PII (DONE — part of M1).
- Auth flow (local master password + login).
- Ready-to-book itinerary output including passenger data and best card recommendation.

### M5: Polish for Open Source
- Documentation (README, architecture, security).
- Example configs, test coverage.
- Packaging for easy install/usage.
- Docker image.

## 10. Future Roadmap

- **Kiwi/Tequila** as secondary provider for flexible date search and airport/location resolution.
- **LLM-powered natural language parsing** via Claude API.
- **Hotels, cars, vacation rentals** (v2+).
- **Web/mobile frontend** using agent-core as a library.
- **Multi-user** with shared preferences.
