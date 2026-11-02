# Architecture

```text
React / Vite
     |
     | HTTPS + JSON
     v
Node.js / Express API
     |
     | JWT authentication
     | Argon2id password hashing
     | AES-256-GCM vault encryption
     v
PostgreSQL
```

Vault records are serialized to JSON, encrypted with AES-256-GCM, then stored as ciphertext, IV, and authentication tag.
