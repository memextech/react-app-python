#!/bin/bash
set -e

# APP_PORT is injected by the sandbox (3000-3099 range)
# Vite dev server listens on APP_PORT so the sandbox proxy can reach it
# FastAPI backend runs on an internal port, proxied by Vite
VITE_PORT=${APP_PORT:-5173}
BACKEND_PORT=3001

uv sync
bun install

# Start FastAPI backend on internal port (background)
uv run uvicorn app:asgi --reload --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Start Vite dev server on the assigned port (foreground)
bunx --bun vite --host 0.0.0.0 --port $VITE_PORT

# Cleanup backend when Vite exits
kill $BACKEND_PID 2>/dev/null
