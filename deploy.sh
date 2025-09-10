#!/bin/bash

# Cloudflare deployment script with retry logic
# This script handles rate limiting and other deployment issues

set -e

echo "🚀 Starting Cloudflare deployment with retry logic..."

# Configuration
MAX_RETRIES=3
RETRY_DELAY=30
CURRENT_RETRY=0

# Function to deploy with retry logic
deploy_with_retry() {
    while [ $CURRENT_RETRY -lt $MAX_RETRIES ]; do
        echo "📦 Deployment attempt $((CURRENT_RETRY + 1)) of $MAX_RETRIES"
        
        if npx wrangler deploy; then
            echo "✅ Deployment successful!"
            return 0
        else
            CURRENT_RETRY=$((CURRENT_RETRY + 1))
            
            if [ $CURRENT_RETRY -lt $MAX_RETRIES ]; then
                echo "⚠️  Deployment failed. Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
                # Exponential backoff
                RETRY_DELAY=$((RETRY_DELAY * 2))
            else
                echo "❌ Deployment failed after $MAX_RETRIES attempts"
                return 1
            fi
        fi
    done
}

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install Node.js"
    exit 1
fi

# Run deployment with retry logic
deploy_with_retry

echo "🎉 Deployment process completed!"