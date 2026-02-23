import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import mysql.connector
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from mysql.connector.abstracts import MySQLConnectionAbstract

from app.models.schemas import AuthResponse, GoogleAuthRequest, LoginRequest, RegisterRequest, RegisteredUser
from app.services.migration_service import MigrationService


class AuthService:
    def __init__(self) -> None:
        MigrationService().run_migrations()
        self.db_config = self._resolve_db_config()

    def register(self, payload: RegisterRequest) -> RegisteredUser:
        email = payload.email.strip().lower()
        if self._find_user_by_email(email) is not None:
            raise ValueError("Email already registered")

        salt = secrets.token_bytes(16)
        password_hash = self._hash_password(payload.password, salt)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (full_name, email, password_hash, password_salt, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    payload.full_name.strip(),
                    email,
                    password_hash,
                    salt.hex(),
                    self._now_utc(),
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

        if user.get("auth_provider") == "google":
            raise ValueError("This account uses Google sign-in. Please continue with Google.")

        salt = bytes.fromhex(user["password_salt"])
        expected_hash = user["password_hash"]
        supplied_hash = self._hash_password(payload.password, salt)

        if supplied_hash != expected_hash:
            raise ValueError("Invalid email or password")

        return self._issue_auth_token(user)

    def google_auth(self, payload: GoogleAuthRequest) -> AuthResponse:
        google_user = self._verify_google_id_token(payload.id_token)
        google_sub = str(google_user.get("sub", "")).strip()
        email = str(google_user.get("email", "")).strip().lower()
        full_name = str(google_user.get("name", "")).strip()
        profile_image_url = str(google_user.get("picture", "")).strip() or None

        if not google_sub or not email:
            raise ValueError("Invalid Google identity token")

        user = self._find_user_by_google_sub(google_sub)
        if user is not None:
            self._update_google_profile(user["id"], full_name, profile_image_url)
            refreshed_user = self._find_user_by_google_sub(google_sub)
            if refreshed_user is None:
                raise ValueError("Unable to refresh Google profile")
            return self._issue_auth_token(refreshed_user)


        user = self._find_user_by_email(email)
        if user is not None:
            if user.get("google_sub") and user.get("google_sub") != google_sub:
                raise ValueError("Google account mismatch for this email")

            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE users
                    SET google_sub = %s, auth_provider = %s, full_name = %s, profile_image_url = %s
                    WHERE id = %s
                    """,
                    (google_sub, "google", full_name or user["full_name"], profile_image_url, user["id"]),
                )
                conn.commit()

            linked_user = self._find_user_by_email(email)
            if linked_user is None:
                raise ValueError("Unable to link Google account")
            return self._issue_auth_token(linked_user)

        new_user_name = full_name or email.split("@")[0]
        salt = secrets.token_bytes(16)
        placeholder_hash = self._hash_password(secrets.token_urlsafe(32), salt)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (full_name, email, password_hash, password_salt, created_at, google_sub, auth_provider)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    new_user_name,
                    email,
                    placeholder_hash,
                    salt.hex(),
                    self._now_utc(),
                    google_sub,
                    "google",
                ),
            )
            conn.commit()

            if profile_image_url:
                cursor.execute(
                    "UPDATE users SET profile_image_url = %s WHERE email = %s",
                    (profile_image_url, email),
                )
                conn.commit()

        created_user = self._find_user_by_email(email)
        if created_user is None:
            raise ValueError("Unable to create Google account")

        return self._issue_auth_token(created_user)

    def authenticate_token(self, access_token: str) -> RegisteredUser:
        if not access_token:
            raise ValueError("Missing access token")

        query = """
            SELECT u.id, u.full_name, u.email, u.profile_image_url, t.expires_at
            FROM auth_tokens t
            JOIN users u ON u.id = t.user_id
            WHERE t.access_token = %s
            ORDER BY t.id DESC
            LIMIT 1
        """

        with self._get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, (access_token,))
            token_row = cursor.fetchone()

        if token_row is None:
            raise ValueError("Invalid token")

        expires_at = self._to_utc_datetime(token_row["expires_at"])

        if expires_at <= datetime.now(timezone.utc):
            raise ValueError("Token expired")

        return RegisteredUser(
            user_id=token_row["id"],
            full_name=token_row["full_name"],
            email=token_row["email"],
            profile_image_url=token_row.get("profile_image_url"),
        )

    def _find_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, full_name, email, password_hash, password_salt, google_sub, auth_provider, profile_image_url FROM users WHERE email = %s",
                (email,),
            )
            return cursor.fetchone()

    def _find_user_by_google_sub(self, google_sub: str) -> Optional[dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, full_name, email, password_hash, password_salt, google_sub, auth_provider, profile_image_url FROM users WHERE google_sub = %s",
                (google_sub,),
            )
            return cursor.fetchone()

    def _update_google_profile(self, user_id: int, full_name: str, profile_image_url: Optional[str]) -> None:
        updates = []
        params: list[Any] = []

        if full_name:
            updates.append("full_name = %s")
            params.append(full_name)

        if profile_image_url is not None:
            updates.append("profile_image_url = %s")
            params.append(profile_image_url)

        if not updates:
            return

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))
            conn.commit()

    def _issue_auth_token(self, user: dict[str, Any]) -> AuthResponse:
        token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO auth_tokens (user_id, access_token, expires_at, created_at)
                VALUES (%s, %s, %s, %s)
                """,
                (user["id"], token, expires_at, self._now_utc()),
            )
            conn.commit()

        return AuthResponse(
            user_id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            access_token=token,
        )

    @staticmethod
    def _verify_google_id_token(raw_id_token: str) -> dict[str, Any]:
        google_client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        if not google_client_id:
            raise ValueError("Google sign-in is not configured on the server")

        try:
            verified = google_id_token.verify_oauth2_token(
                raw_id_token,
                google_requests.Request(),
                google_client_id,
            )
            if not isinstance(verified, dict):
                raise ValueError("Invalid Google identity token")
            if not verified.get("email_verified"):
                raise ValueError("Google email is not verified")
            return verified
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("Invalid Google identity token") from exc

    def _get_connection(self, include_database: bool = True) -> MySQLConnectionAbstract:
        config = {
            "host": self.db_config["host"],
            "port": self.db_config["port"],
            "user": self.db_config["user"],
            "password": self.db_config["password"],
        }

        if include_database:
            config["database"] = self.db_config["database"]

        return mysql.connector.connect(**config)

    @staticmethod
    def _hash_password(password: str, salt: bytes) -> str:
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return digest.hex()

    @staticmethod
    def _resolve_db_config() -> dict[str, Any]:
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_PASSWORD", "")
        database = os.getenv("MYSQL_DATABASE", "ats_buddy")

        return {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "database": database,
        }

    @staticmethod
    def _now_utc() -> datetime:
        return datetime.now(timezone.utc).replace(tzinfo=None)

    @staticmethod
    def _to_utc_datetime(value: Any) -> datetime:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value.astimezone(timezone.utc)

        if isinstance(value, str):
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)

        raise ValueError("Invalid token expiration format")
