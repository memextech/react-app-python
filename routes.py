import os

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from workshop_identity import WORKSHOP_JWKS_PATH, require_workshop_user


def create_app(static_dir: str) -> FastAPI:
    api = APIRouter()

    @api.get("/health")
    def health():
        return {
            "ok": True,
            "workshop_custom_domain_configured": bool(
                os.environ.get("WORKSHOP_CUSTOM_DOMAIN")
            ),
            "workshop_app_slug_configured": bool(os.environ.get("WORKSHOP_APP_SLUG")),
        }

    @api.get("/me")
    def me(request: Request):
        try:
            user = require_workshop_user(request)
        except HTTPException as exc:
            if exc.status_code != 401:
                raise
            return JSONResponse(content={"authenticated": False})

        return {
            "authenticated": True,
            "uid": user["uid"],
            "email": user["email"],
        }

    @api.get("/identity-diagnostics")
    def identity_diagnostics(request: Request):
        public_domain = os.environ.get("WORKSHOP_CUSTOM_DOMAIN")
        app_slug = os.environ.get("WORKSHOP_APP_SLUG")
        return {
            "header_present": bool(request.headers.get("x-workshop-user")),
            "jwks_path": WORKSHOP_JWKS_PATH,
            "public_domain": public_domain,
            "app_slug": app_slug,
            "ready_to_verify": bool(public_domain and app_slug),
        }

    app = FastAPI()
    app.include_router(api, prefix="/api")

    if os.path.isdir(static_dir):
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{path:path}")
        async def spa_fallback(request: Request, path: str):
            file_path = os.path.join(static_dir, path)
            if path and os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(
                os.path.join(static_dir, "index.html"),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            )

    return app
