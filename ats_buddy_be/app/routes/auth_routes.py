from fastapi import APIRouter, Depends, HTTPException

from app.controllers.auth_controller import AuthController
from app.models.schemas import GoogleAuthRequest, LoginRequest, RegisterRequest
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
controller = AuthController()


@router.post("/register")
def register(payload: RegisterRequest):
    try:
        return controller.register(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login")
def login(payload: LoginRequest):
    try:
        return controller.login(payload)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/google")
def google_auth(payload: GoogleAuthRequest):
    try:
        return controller.google_auth(payload)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return controller.me(current_user)
