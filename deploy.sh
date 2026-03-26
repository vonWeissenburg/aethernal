#!/bin/bash
set -e

APP_DIR="/opt/aether/apps/nextjs"
cd "$APP_DIR"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building Docker image..."
docker compose build --no-cache

echo "==> Restarting container..."
docker compose up -d --force-recreate

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete!"
docker compose ps
