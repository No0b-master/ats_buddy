from fastapi import APIRouter, HTTPException

from app.controllers.auth_controller import AuthController
from app.models.schemas import LoginRequest, RegisterRequest

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
