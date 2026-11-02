# Start Here

## Fastest local run

Make sure Docker Desktop is open.

From the SecureVault folder:

```bash
./setup.sh
npm run dev
```

Then open:

```text
http://localhost:5173
```

## If `./setup.sh` says permission denied

Run:

```bash
chmod +x setup.sh
./setup.sh
```

## If you prefer separate terminals

Terminal 1:

```bash
docker compose up -d
cd backend
npm install
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

## Important before GitHub

The included `.env` files contain development-only secrets so the downloaded project can run immediately. They are ignored by `.gitignore` and should not be committed.

For deployment, create new production secrets and use `.env.example` as the reference.
