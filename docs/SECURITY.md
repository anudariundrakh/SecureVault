# Security Notes

SecureVault currently demonstrates a practical security-focused MVP.

## Implemented

- Argon2id for account password hashing
- AES-256-GCM authenticated encryption for vault records at rest
- JWT authentication
- Authorization checks on every vault item query
- Parameterized PostgreSQL queries
- Helmet HTTP security headers
- API rate limiting
- Request body validation
- Cryptographically secure password generation via Web Crypto

## Threat model covered by the MVP

- A database dump does not directly expose plaintext vault items.
- Login passwords are never stored in plaintext.
- One authenticated user cannot retrieve another user's vault items through normal API routes.
- SQL values are passed through parameters instead of string concatenation.

## Important limitations

- Encryption currently occurs on the backend, so the running backend possesses the encryption key.
- Access tokens are stored in sessionStorage for the MVP. A production hardening phase should move toward an HttpOnly refresh-token flow.
- TOTP MFA, recovery codes, device/session management, and client-side key derivation are planned next.
