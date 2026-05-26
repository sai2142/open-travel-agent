# Open Travel Agent vs Skyscanner vs Expedia

## Feature Comparison

| Feature | Open Travel Agent | Skyscanner | Expedia |
|---------|------------------|------------|---------|
| **Flight search** | Yes (300+ airlines via Duffel) | Yes (900+ providers) | Yes (major airlines + OTAs) |
| **Price comparison** | Yes (single provider view) | Yes (multi-provider meta-search) | Yes (OTA + airline direct) |
| **Credit card rewards scoring** | Yes (built-in, rule-based) | No | No |
| **"Which card to use" rec** | Yes | No | No |
| **Effective price after rewards** | Yes | No | No |
| **Direct booking** | No (ready-to-book handoff) | Redirect to provider | Yes (full booking) |
| **Payment processing** | No (v1) | Via partners | Yes |
| **Flexible date search** | No (exact dates only) | Yes ("whole month" view) | Yes (±3 days) |
| **Price alerts** | No | Yes | Yes |
| **Hotel/car bundling** | No (flights only) | Yes | Yes (packages) |
| **Local PII vault** | Yes (AES-256-GCM encrypted) | No (cloud accounts) | No (cloud accounts) |
| **Privacy** | PII never leaves device | Account-based, cookies | Account-based, cookies |
| **API/CLI access** | Yes (primary interface) | No public API | No public API |
| **JSON output for scripting** | Yes | No | No |
| **Open source** | Yes | No | No |
| **Offline mode (mock data)** | Yes | No | No |
| **Natural language queries** | Planned (via LLM) | No | No |

## Where Open Travel Agent Excels

1. **Credit card rewards integration** — No competitor does this. Knowing which card to use and seeing effective price after rewards is the core differentiator. A $500 flight that earns $75 in rewards and unlocks a free checked bag is objectively different from what Skyscanner shows.

2. **Privacy-first design** — Passport, KTN, loyalty numbers never leave the device. No account creation, no cookies, no tracking. For security-conscious travelers, this matters.

3. **Developer experience** — CLI-first, JSON output, open source. Can be embedded in scripts, cron jobs, or other tools. Skyscanner and Expedia have no public API for individual developers.

4. **Transparency** — Scoring breakdown is visible (price 35%, duration 25%, stops 20%, time 10%, airline 5%, rewards 5%). Users can understand *why* a flight ranks where it does.

## Where Open Travel Agent Lacks (vs Skyscanner/Expedia)

### 1. Provider Coverage
- **Skyscanner** aggregates from 900+ partners, including OTAs like Kiwi, Trip.com, and budget carriers that may not appear in Duffel.
- **Our tool** searches Duffel's ~300 airline sources. Some budget/regional carriers may be missing.
- **Impact**: Potentially missing the cheapest option on niche routes.
- **Mitigation**: Add Kiwi/Tequila as a secondary provider (in roadmap).

### 2. Flexible Date Search
- **Skyscanner's "Whole Month" view** lets users see the cheapest day to fly. Expedia shows ±3 day grids.
- **Our tool** requires exact dates.
- **Impact**: Users who are flexible on dates miss the cheapest day.
- **Mitigation**: Add Kiwi/Tequila provider (supports flexible dates) or implement multi-date search that runs parallel queries.

### 3. Price Alerts / Tracking
- **Skyscanner** sends email/push alerts when prices drop.
- **Our tool** is stateless — each search is independent.
- **Impact**: Users can't monitor a route over time.
- **Mitigation**: Could add a `travel-agent watch` command with local cron + notification.

### 4. Direct Booking
- **Expedia** completes the entire booking (seat selection, payment, confirmation).
- **Skyscanner** redirects to the airline/OTA to complete booking.
- **Our tool** shows a link and ready-to-paste details — user completes booking themselves.
- **Impact**: More friction at the booking step.
- **Mitigation**: This is intentional for v1 (no PCI compliance needed, no payment risk).

### 5. Hotels, Cars, Packages
- Both Skyscanner and Expedia offer bundled hotel/car/flight packages.
- **Our tool** is flights-only.
- **Impact**: Users planning full trips need multiple tools.
- **Mitigation**: Future roadmap (v2+).

### 6. Visual UI
- Skyscanner and Expedia have rich visual timelines, maps, and calendar views.
- **Our tool** is CLI text only.
- **Impact**: Less intuitive for non-technical users.
- **Mitigation**: Future web frontend using agent-core as a library.

### 7. Domestic Route Coverage (Duffel Sandbox)
- In testing, the Duffel sandbox returned limited results for US domestic routes (DFW→CMH: 2-17 results vs hundreds on Skyscanner).
- **Note**: This is sandbox limitation — production Duffel with a live token returns significantly more results.

## Strategic Positioning

Open Travel Agent is not trying to replace Skyscanner/Expedia. It targets a specific niche:

> **Technically sophisticated travelers who hold multiple credit cards and want to optimize total cost of travel (fare + rewards + perks) in a privacy-respecting, scriptable tool.**

The competitors optimize for price alone. We optimize for **net value** — the actual cost after factoring in rewards, perks, and card benefits.
