#!/usr/bin/env bash
set -e

echo "Installing SecureVault dependencies..."
npm install
npm run install:all

echo "Starting PostgreSQL..."
docker compose up -d

echo ""
echo "Setup complete. Run: npm run dev"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
