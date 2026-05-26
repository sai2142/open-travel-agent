# Security Overview

## Principles

1. **PII stays local** — Passport, KTN, and loyalty numbers are never sent to any remote server.
2. **Secrets never in source** — API tokens loaded from environment variables or encrypted config.
3. **Encryption at rest** — The identity vault uses AES-256-GCM with Argon2id-derived keys.
4. **Minimal attack surface** — No web server, no remote PII storage, no payment handling.

## Identity Vault

### Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: Argon2id with 64 MiB memory cost, 3 iterations, 1 parallelism
- **Fallback KDF**: PBKDF2-SHA256 with 100,000 iterations (if argon2 native module unavailable)
- **Salt**: 32 random bytes, stored alongside vault file

### Vault File Format
```
[IV: 12 bytes] [Auth Tag: 16 bytes] [Ciphertext: variable]
```

### Key Lifecycle
- Derived from master password on `vault unlock`
- Held in process memory during CLI session
- Explicitly zeroed on `vault lock` or process exit

## API Credentials

- **Duffel**: Bearer token loaded from `DUFFEL_ACCESS_TOKEN` env var. Test tokens start with `duffel_test_`, live tokens with `duffel_live_`.
- **Anthropic API key**: loaded from `ANTHROPIC_API_KEY` env var (future milestone).
- `.env` file excluded from git via `.gitignore`
- `.env.example` contains placeholders only

## Logging

- Default mode: no PII or secrets in output
- `--debug` mode: redacts sensitive values (passport numbers, API tokens)

## Future Considerations

- Payment tokenization: if booking is ever added, payment data must be handled by PCI-compliant processors
- Vault migration: version the vault format for future encryption upgrades
- Memory protection: consider using secure buffers for key material
