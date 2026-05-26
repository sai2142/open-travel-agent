# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-26

### Added
- **Flexible Date Search Engine** — provider-agnostic layer in agent-core
  - `date-flex` mode: search ±N days around departure/return dates
  - `weekend` mode: search all Fri→Sun weekends in a target month
  - `trip-length` mode: find cheapest N-to-M day trip in a month
  - Parallel search with configurable concurrency limit (default 3)
  - In-memory TTL cache (default 5 min) to avoid duplicate API calls
  - `maxCombinations` cap (default 30) for cost control
  - Progress callbacks for CLI spinners
- CLI flags: `--date-flex`, `--weekend-month`, `--trip-length-min`, `--trip-length-max`, `--matrix`
- Date-price matrix output (2D departure × return grid with color coding)
- Ranked date grid output (sorted by cheapest across all combinations)
- JSON output for flexible search results
- New shared types: `FlexibleSearchRequest`, `DatePair`, `DateGridResult`, `DateGridCell`
- 20 new tests (49 total, all passing)
- GitHub Actions CI workflow (test + typecheck on Node 20/22)
- GitHub Actions NPM publish workflow (on release tag)
- Multi-stage Dockerfile with token injection
- Package build configs (dist/, exports, files arrays)
- CHANGELOG.md

### Changed
- All packages bumped to 0.2.0
- Package exports now point to compiled `dist/` for NPM publishing
- Updated `.dockerignore` with additional exclusions

## [0.1.0] - 2026-05-26

### Added
- Monorepo scaffold with 4 packages (shared-types, agent-core, provider-mock, provider-duffel)
- Duffel live integration — 300+ airlines, 100-500 flights per search
- Credit card rewards scoring engine (7 cards: Chase Sapphire Preferred/Reserve, Amex Platinum, Capital One Venture/Venture X, United Explorer, Delta SkyMiles Gold)
- Persistent card profile management (`cards add/remove/list`)
- Encrypted identity vault (AES-256-GCM + Argon2id) for passport, KTN, FF numbers
- Ready-to-book output with fare breakdown, card recommendation, airline deeplinks, Google Flights links
- CLI with commander: `search`, `cards`, `vault`, `book` commands
- Mock flight provider for development and testing
- 33 tests (27 unit + 6 live Duffel integration)
