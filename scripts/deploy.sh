#!/usr/bin/env bash
# ==============================================================================
# S30 Ticket Agent - Deployment Script
# ==============================================================================
# Pulls latest code, rebuilds containers, runs healthchecks, and reloads Nginx.
# Can be run manually or invoked via GitHub Actions SSH.
# ==============================================================================

set -euo pipefail

APP_DIR="${1:-/home/ubuntu/ticket-agent}"
cd "$APP_DIR"

echo ">>> [1/5] Pulling latest changes from Git..."
git fetch origin main
git reset --hard origin/main

echo ">>> [2/5] Checking environment configuration..."
if [ ! -f "apps/backend/.env" ]; then
    echo "ERROR: apps/backend/.env is missing! Please create it before deploying."
    exit 1
fi

echo ">>> [3/5] Rebuilding and starting Docker containers..."
docker compose down || true
docker compose up -d --build --remove-orphans

echo ">>> [4/5] Pruning dangling Docker images..."
docker image prune -f || true

echo ">>> [5/5] Performing health verification..."
ATTEMPTS=0
MAX_ATTEMPTS=15
HEALTH_URL="http://127.0.0.1:3000/health"

until curl -sf "$HEALTH_URL" > /dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
        echo "ERROR: Backend health check failed after $MAX_ATTEMPTS attempts."
        docker compose logs --tail 50 backend
        exit 1
    fi
    echo "Waiting for backend to become healthy... ($ATTEMPTS/$MAX_ATTEMPTS)"
    sleep 3
done

echo ">>> Backend is healthy! Reloading Nginx..."
sudo systemctl reload nginx || true

echo "======================================================================"
echo ">>> Deployment successfully finished at $(date)!"
echo "======================================================================"
