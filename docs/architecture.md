# Architecture

## Overview

Open Travel Agent CLI is a monorepo with four internal packages and a CLI entry point.
The agent only depends on the generic `FlightProvider` interface — never on Duffel-specific response types.

```
┌─────────────────────────────────────────────────┐
│                    CLI (src/)                    │
│          (commander + ora + inquirer)            │
├─────────────────────────────────────────────────┤
│               agent-core package                │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Scoring  │  Vault   │  Config  │  Output  │  │
│  │ Engine   │(AES-GCM) │ (cards)  │(text/json│  │
│  └──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────┤
│            shared-types package                 │
│  FlightProvider interface + normalized schemas  │
├──────────────┬──────────────┬───────────────────┤
│ provider-    │ provider-    │                   │
│ duffel       │ mock         │ + future providers│
│ (Duffel API) │ (fixtures)   │ (Kiwi, etc.)     │
└──────────────┴──────────────┴───────────────────┘
```

## Package Dependency Graph

```
src/cli.ts
  └── @open-travel-agent/agent-core
  │     └── @open-travel-agent/shared-types
  └── @open-travel-agent/provider-mock
  │     └── @open-travel-agent/shared-types
  └── @open-travel-agent/provider-duffel
        └── @open-travel-agent/shared-types
```

The CLI imports from all four packages. Provider packages depend only on `shared-types`.
`agent-core` depends on `shared-types`. No provider depends on another provider or on `agent-core`.

## Key Design Decisions

### Provider abstraction
All flight providers implement `FlightProvider` from `shared-types`. Duffel is the primary provider; a mock provider enables development without API credentials. Adding a new provider means implementing one interface in a new package.

### Normalized schema
Provider responses are mapped into `FlightOffer` before scoring. This decouples ranking from any single provider's data format. Duffel-specific types are internal to `provider-duffel` and not exported.

### Scoring engine
Rule-based weighted scoring across six dimensions:
- Price (35%)
- Duration (25%)
- Stops (20%)
- Departure time alignment (10%)
- Airline preference (5%)
- Rewards value (5%)

### Identity vault
AES-256-GCM encryption with Argon2id key derivation. Single encrypted file on disk. Key held in memory only while CLI is running, explicitly cleared on exit.

### No LLM in the hot path (v1)
Scoring is deterministic and rule-based. LLM integration (for NL parsing) is planned but not in the search/score critical path.

## Data Flow

```
User input (CLI flags or NL prompt)
    │
    ▼
SearchRequest (normalized, from shared-types)
    │
    ▼
FlightProvider.search()        ← provider-duffel or provider-mock
    │
    ▼
FlightOffer[] (normalized)     ← provider maps to shared-types schema
    │
    ▼
scoreOffers()                  ← agent-core/scoring
    │
    ▼
ScoredOffer[] (ranked)
    │
    ▼
formatRankedResults()          ← agent-core/output
    │
    ▼
CLI output (text or JSON)
```

## Duffel-Specific Notes

Duffel uses a two-step offer request flow:
1. `POST /air/offer_requests` with `return_offers: true` (synchronous, blocks ~5-15s)
2. Response includes offers inline

See `packages/provider-duffel/INTEGRATION.md` for the full endpoint mapping and TODO list.

## Future: Adding a New Provider

1. Create `packages/provider-{name}/`
2. Implement `FlightProvider` interface
3. Map provider response → `FlightOffer`
4. Add to CLI's provider selection logic in `src/cli/search.ts`
5. No changes needed to `agent-core` or `shared-types`
