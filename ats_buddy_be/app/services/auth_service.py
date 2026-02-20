import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from app.models.schemas import AuthResponse, LoginRequest, RegisterRequest, RegisteredUser


class AuthService:
    def __init__(self) -> None:
        self.db_path = self._resolve_db_path()
        self._ensure_tables()

    def register(self, payload: RegisterRequest) -> RegisteredUser:
        email = payload.email.strip().lower()
        if self._find_user_by_email(email) is not None:
            raise ValueError("Email already registered")

        salt = secrets.token_bytes(16)
        password_hash = self._hash_password(payload.password, salt)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (full_name, email, password_hash, password_salt, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    payload.full_name.strip(),
                    email,
                    password_hash,
                    salt.hex(),
                    self._now_iso(),
                ),
            )
            conn.commit()
            user_id = cursor.lastrowid

        return RegisteredUser(
            user_id=user_id,
            full_name=payload.full_name.strip(),
            email=email,
        )

    def login(self, payload: LoginRequest) -> AuthResponse:
        email = payload.email.strip().lower()
        user = self._find_user_by_email(email)
        if user is None:
            raise ValueError("Invalid email or password")

        salt = bytes.fromhex(user["password_salt"])
        expected_hash = user["password_hash"]
        supplied_hash = self._hash_password(payload.password, salt)

        if supplied_hash != expected_hash:
            raise ValueError("Invalid email or password")

        token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO auth_tokens (user_id, access_token, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (user["id"], token, expires_at.isoformat(), self._now_iso()),
            )
            conn.commit()

        return AuthResponse(
            user_id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            access_token=token,
        )

    def authenticate_token(self, access_token: str) -> RegisteredUser:
        if not access_token:
            raise ValueError("Missing access token")

        query = """
            SELECT u.id, u.full_name, u.email, t.expires_at
            FROM auth_tokens t
            JOIN users u ON u.id = t.user_id
            WHERE t.access_token = ?
            ORDER BY t.id DESC
            LIMIT 1
        """

        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, (access_token,))
            token_row = cursor.fetchone()

        if token_row is None:
            raise ValueError("Invalid token")

        expires_at = datetime.fromisoformat(token_row["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at <= datetime.now(timezone.utc):
            raise ValueError("Token expired")

        return RegisteredUser(
            user_id=token_row["id"],
            full_name=token_row["full_name"],
            email=token_row["email"],
        )

    def _find_user_by_email(self, email: str) -> Optional[sqlite3.Row]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, full_name, email, password_hash, password_salt FROM users WHERE email = ?",
                (email,),
            )
            return cursor.fetchone()

    def _ensure_tables(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    access_token TEXT NOT NULL UNIQUE,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(access_token)"
            )
            conn.commit()

    @staticmethod
    def _hash_password(password: str, salt: bytes) -> str:
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return digest.hex()

    @staticmethod
    def _resolve_db_path() -> str:
        base_dir = Path(__file__).resolve().parents[2]
        data_dir = base_dir / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        return str(data_dir / "ats_buddy.db")

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()
