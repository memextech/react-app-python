import os
from typing import TypedDict

import jwt
from fastapi import HTTPException, Request
from jwt import PyJWKClient

WORKSHOP_JWKS_PATH = "/.well-known/workshop-identity/jwks.json"
WORKSHOP_ISSUER = "workshop-auth-proxy"


class WorkshopUser(TypedDict):
    uid: str
    email: str | None


def require_workshop_user(request: Request) -> WorkshopUser:
    token = request.headers.get("x-workshop-user")
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")

    public_domain = os.environ.get("WORKSHOP_CUSTOM_DOMAIN", "")
    audience = os.environ.get("WORKSHOP_APP_SLUG", "")
    if not public_domain or not audience:
        raise HTTPException(
            status_code=500,
            detail="Workshop identity is not configured",
        )

    jwks_url = f"https://{public_domain}{WORKSHOP_JWKS_PATH}"

    try:
        signing_key = PyJWKClient(
            jwks_url,
            headers={"User-Agent": "Workshop identity verifier"},
        ).get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=audience,
            issuer=WORKSHOP_ISSUER,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid viewer identity",
        ) from exc

    uid = claims.get("sub")
    if not isinstance(uid, str) or not uid:
        raise HTTPException(status_code=401, detail="Invalid viewer identity")

    email = claims.get("email")
    if email is not None and not isinstance(email, str):
        raise HTTPException(status_code=401, detail="Invalid viewer identity")

    return {"uid": uid, "email": email}
