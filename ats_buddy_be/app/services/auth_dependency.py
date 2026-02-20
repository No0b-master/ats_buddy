from fastapi import Header, HTTPException

from app.models.schemas import RegisteredUser
from app.services.auth_service import AuthService


auth_service = AuthService()


def get_current_user(authorization: str = Header(default="")) -> RegisteredUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authorization header with Bearer token is required")

    token = authorization.split(" ", 1)[1].strip()
    try:
        return auth_service.authenticate_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
