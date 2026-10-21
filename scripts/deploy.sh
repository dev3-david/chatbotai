#!/usr/bin/env bash
# Rebuild and restart the app on the Docker host (Proxmox CT 118).
#
# Run from the repo checkout on the server, after checking out the commit to deploy:
#   cd /opt/chatbotai && git fetch -q origin && git checkout -q --detach <sha> && bash scripts/deploy.sh
# The n8n pipeline runs exactly that over SSH. Exit code 0 = deployed and healthy.
set -euo pipefail

APP_URL="http://localhost:${APP_PORT:-3000}/"

echo "==> Deploying $(git rev-parse --short HEAD): $(git log -1 --format=%s)"
docker compose up -d --build app

echo "==> Waiting for $APP_URL"
code=000
for _ in $(seq 1 45); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL" || true)
  [ "$code" = "200" ] && break
  sleep 2
done

# Old images and build cache pile up on every rebuild; the disk is only 32 GB.
# Cap the build cache at 3 GB: enough to keep the npm install layer warm.
docker image prune -f >/dev/null
docker builder prune -f --max-used-space 3gb >/dev/null

if [ "$code" != "200" ]; then
  echo "!! Health check failed (HTTP $code). Last app logs:"
  docker compose logs --tail 40 app
  exit 1
fi
echo "==> Healthy (HTTP 200)"
