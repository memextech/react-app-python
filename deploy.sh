#!/bin/bash
set -e

echo "Building frontend..."
bun install
bunx --bun vite build

echo "Deploying to Modal..."
uv sync
uv run modal deploy app.py

echo ""
echo "Deployment complete!"
echo "Your app is now live on Modal."
