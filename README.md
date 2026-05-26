# Open Travel Agent CLI

AI-powered CLI agent for searching flights across providers, optimizing for credit card rewards, and generating ready-to-book itineraries.

## What it does

- **Search flights** across 300+ airlines via Duffel (or mock data for testing)
- **Score & rank** by price, duration, stops, time preferences, and airline preference
- **Rewards-aware recommendations** — knows your credit cards and suggests the best one per itinerary
- **Encrypted identity vault** — passport, KTN, and loyalty numbers stored locally with AES-256-GCM + Argon2id
- **Ready-to-book output** — itinerary details, booking links, passenger data, and card recommendation

## What it does NOT do

- No direct booking or payment processing
- No hotels, cars, or vacation rentals (v1)
- No hosted SaaS — everything runs locally
- No live bank/issuer API integration (rule-based rewards modeling only)

## Prerequisites

- Node.js >= 20
- A [Duffel account](https://app.duffel.com/join) (free sandbox) for live search
- No Duffel account needed for mock/testing mode

## Quickstart

```bash
# Clone and install
git clone <repo-url>
cd open-travel-agent
npm install

# Configure (or skip for mock mode)
cp .env.example .env
# Edit .env with your Duffel access token

# Search flights (mock mode)
npx tsx src/cli.ts search --from DFW --to CDG --depart 2026-09-05 --return 2026-09-12 --mock

# Search with card recommendations
npx tsx src/cli.ts search --from DFW --to CDG --depart 2026-09-05 --mock --cards chase-sapphire-reserve,amex-platinum

# List available cards
npx tsx src/cli.ts cards

# Nonstop flights only
npx tsx src/cli.ts search --from DFW --to CUN --depart 2026-08-15 --direct --mock

# JSON output for scripting
npx tsx src/cli.ts search --from DFW --to CDG --depart 2026-09-05 --mock --json
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `travel-agent search` | Search and rank flights |
| `travel-agent cards` | List available credit cards for rewards scoring |
| `travel-agent vault show` | Display vault contents |
| `travel-agent vault set` | Add/update passport, KTN, loyalty numbers |
| `travel-agent init` | Setup wizard (coming soon) |
| `travel-agent profile` | Manage preferences (coming soon) |

## Search Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--from <code>` | Origin airport (required) | — |
| `--to <code>` | Destination airport (required) | — |
| `--depart <date>` | Departure date YYYY-MM-DD (required) | — |
| `--return <date>` | Return date for round-trip | — |
| `--passengers <n>` | Number of passengers | 1 |
| `--cabin <class>` | ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST | ECONOMY |
| `--max-stops <n>` | Maximum stops allowed | — |
| `--max-price <amount>` | Maximum price per person | — |
| `--direct` | Nonstop flights only | false |
| `--airlines <codes>` | Preferred airlines (comma-separated) | — |
| `--cards <ids>` | Card IDs for rewards scoring (comma-separated) | — |
| `--json` | Output as JSON | false |
| `--top <n>` | Number of results to show | 5 |
| `--mock` | Force mock provider | false |

## Security

- PII stored locally in AES-256-GCM encrypted vault with Argon2id key derivation
- API tokens loaded from environment variables, never hardcoded
- No PII transmitted to any server
- Debug mode redacts sensitive values

See [docs/security.md](docs/security.md) for full details.

## Project Structure

```
open-travel-agent/
├── packages/
│   ├── shared-types/        # FlightProvider interface + normalized schemas
│   ├── agent-core/          # Scoring, vault, config, output formatting
│   ├── provider-mock/       # Mock provider for testing
│   └── provider-duffel/     # Duffel API integration
├── src/                     # CLI entry point
│   ├── cli.ts
│   └── cli/
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   └── security.md
└── .env.example
```

See [docs/architecture.md](docs/architecture.md) for design details.

## Development

```bash
npm run dev -- search --from DFW --to CDG --depart 2026-09-05 --mock
npm test
npm run typecheck
```

## Adding a New Provider

1. Create `packages/provider-{name}/`
2. Implement the `FlightProvider` interface from `@open-travel-agent/shared-types`
3. Map provider responses to `FlightOffer`
4. Wire into `src/cli/search.ts`
5. No changes needed to `agent-core` or `shared-types`

## License

MIT
