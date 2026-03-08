#!/bin/bash
set -e
uv sync
bun install

# Start FastAPI backend on port 3001 (background)
uv run uvicorn app:asgi --reload --host 0.0.0.0 --port 3001 &
BACKEND_PID=$!

# Start Vite dev server (foreground)
bunx --bun vite --host 0.0.0.0

# Cleanup backend when Vite exits
kill $BACKEND_PID 2>/dev/null
