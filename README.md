# Workshop Viewer Identity Demo

A full-stack demo branch for Workshop signed viewer identity passthrough. It uses React + TypeScript + Tailwind CSS + shadcn/ui on the frontend and FastAPI on the backend.

The app shows the current viewer returned by `/api/me`. That route verifies the `X-Workshop-User` JWT sent by Workshop when identity passthrough is enabled on the published app.

## Quick Start

```bash
bash start.sh
```

This installs dependencies and starts both the Vite dev server (frontend) and the FastAPI backend.

Local development does not include a real `X-Workshop-User` header, so the viewer will appear anonymous. Deploy the app through Workshop with identity passthrough enabled to see a verified viewer.

## Project Structure

```
├── src/                  # React frontend
│   ├── components/ui/    # shadcn/ui components
│   ├── lib/              # Utilities
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── app.py                # FastAPI entry point
├── routes.py             # API routes + SPA fallback
├── workshop_identity.py  # X-Workshop-User verification helper
├── secrets_utils.py      # OAuth token utility
├── start.sh              # Dev server launcher
└── pyproject.toml        # Python dependencies
```

## Development

- Frontend: Edit `src/App.tsx` and files in `src/`
- Backend API: Add routes in `routes.py`
- The Vite dev server proxies `/api` requests to the FastAPI backend

## Identity Flow

1. Workshop authenticates the viewer before proxying the request.
2. The Workshop auth proxy signs a short-lived JWT and sends it to the app as `X-Workshop-User`.
3. `/api/me` calls `require_workshop_user(request)` from `workshop_identity.py`.
4. The helper fetches the public JWKS from `https://$WORKSHOP_CUSTOM_DOMAIN/.well-known/workshop-identity/jwks.json`.
5. The helper verifies ES256 signature, issuer, audience, and expiration before returning `{ uid, email }`.

The frontend cannot read navigation request headers directly, so it calls `/api/me` and renders the verified JSON response.

## Deploy With Identity Passthrough

```bash
wksp deploy --visibility private --identity-passthrough --port 3000
```

For the dev environment:

```bash
wksp --env dev project-create --name "Viewer identity demo"
wksp --env dev deploy --visibility private --identity-passthrough --port 3000
```

The deployed app receives:

| Value | Source |
| --- | --- |
| `X-Workshop-User` | Signed JWT request header |
| `WORKSHOP_CUSTOM_DOMAIN` | Public app domain |
| `WORKSHOP_APP_SLUG` | Token audience |
| `/.well-known/workshop-identity/jwks.json` | Public verification keys |

## Useful Checks

```bash
bun install --frozen-lockfile
bun run lint
bun run build
uv sync --frozen
uv run python -m py_compile app.py routes.py workshop_identity.py
```
