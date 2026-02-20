import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth_routes import router as auth_router
from app.routes.ats_routes import router as ats_router

app = FastAPI(
    title="ATS Buddy UAE API",
    version="1.0.0",
    description="ATS checker and resume optimizer APIs for UAE market",
)


def _build_allowed_origins() -> list[str]:
    origins_from_env = os.getenv("ALLOWED_ORIGINS", "").strip()
    if origins_from_env:
        return [origin.strip() for origin in origins_from_env.split(",") if origin.strip()]

    return [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ats_router)
app.include_router(auth_router)
