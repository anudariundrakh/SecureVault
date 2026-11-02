# SecureVault

A polished full-stack password manager MVP built with React, Node.js, Express, PostgreSQL, JWT, Argon2id, and AES-256-GCM.

## What is implemented

- Account registration and login
- Argon2id password hashing
- JWT-protected API routes
- AES-256-GCM encryption for stored vault records
- PostgreSQL persistence
- Create, edit, search, copy, and delete credentials
- Cryptographically secure password generator in the browser
- Rate limiting, Helmet security headers, input validation, and parameterized SQL
- Minimal responsive UI
- Dockerized PostgreSQL
- Deployment-ready environment configuration

> Note: This MVP encrypts vault entries on the backend before they are stored in PostgreSQL. It is not a zero-knowledge/client-side-encryption design yet. Do not claim that the server cannot decrypt vault entries until client-side encryption is implemented.

## Project structure

```text
SecureVault/
├── frontend/
├── backend/
├── docs/
├── docker-compose.yml
└── README.md
```

## 1. Start PostgreSQL

```bash
docker compose up -d
```

PostgreSQL is exposed at `localhost:5433`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs on `http://localhost:3000`.

Generate a production encryption key with:

```bash
openssl rand -base64 32
```

Put that value in `ENCRYPTION_KEY` inside `backend/.env`.

## 3. Frontend setup

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Test account flow

1. Open the frontend.
2. Create an account with a password of at least 12 characters.
3. Add a credential.
4. Refresh the page and log back in.
5. Verify the credential remains available.

## Deploy

The frontend and backend can be deployed separately. Set these environment variables in production:

### Backend

```text
DATABASE_URL=<production PostgreSQL URL>
JWT_SECRET=<long random secret>
ENCRYPTION_KEY=<base64 32-byte key>
FRONTEND_ORIGIN=<frontend public URL>
NODE_ENV=production
```

### Frontend

```text
VITE_API_URL=<backend public URL>/api
```

Do not commit production secrets.
