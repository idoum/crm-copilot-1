#!/bin/bash
# =====================================================
# Manual Deploy Script for CRM Copilot
# Run from local machine to deploy to VPS
# =====================================================

set -e

# Configuration
VPS_HOST="${VPS_HOST:-76.13.106.159}"
VPS_USER="${VPS_USER:-root}"
DEPLOY_PATH="/opt/crm"
IMAGE_NAME="ghcr.io/idoum/crm-copilot-1:latest"

echo "🚀 Deploying CRM Copilot to $VPS_HOST..."

# Build Docker image locally
echo "📦 Building Docker image..."
docker build -t "$IMAGE_NAME" .

# Push to GHCR (requires docker login ghcr.io first)
echo "⬆️  Pushing image to GHCR..."
docker push "$IMAGE_NAME"

# Deploy on VPS
echo "🔄 Deploying on VPS..."
ssh "$VPS_USER@$VPS_HOST" << EOF
  cd $DEPLOY_PATH
  docker compose pull
  docker compose up -d
  docker image prune -f
  echo "✅ Deployment complete!"
  docker compose ps
EOF

echo "🎉 Deploy finished! Visit https://crm.isprojets.cloud"
