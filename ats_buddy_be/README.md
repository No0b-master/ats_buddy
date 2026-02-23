# ATS Buddy Backend (UAE)

Python FastAPI backend for ATS checking and resume optimization focused on the UAE job market.

## Tech Stack
- FastAPI
- Pydantic
- Uvicorn

## Architecture (MVC)
- `app/models`: Request/response schemas and domain models
- `app/controllers`: HTTP orchestration layer
- `app/views`: API response shaping
- `app/services`: Core ATS and optimization business logic
- `app/routes`: API route registration

## Run
```bash
cd ats_buddy_be
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create a `.env` file in `ats_buddy_be` (you can copy from `.env.example`).

## Database (MySQL)
Authentication data now uses MySQL (not SQLite).

Required environment variables:
- `MYSQL_HOST` (default: `localhost`)
- `MYSQL_PORT` (default: `3306`)
- `MYSQL_USER` (default: `root`)
- `MYSQL_PASSWORD` (default: empty)
- `MYSQL_DATABASE` (default: `ats_buddy`)
- `GOOGLE_CLIENT_ID` (required for Google sign-in)

`python-dotenv` is enabled, so values are loaded automatically from `.env` when the app starts.

## Migrations
- SQL migrations are stored in `app/migrations`.
- On startup, backend automatically:
	- creates the configured MySQL database if missing,
	- creates `schema_migrations` table,
	- applies pending `*.sql` migrations in filename order.

Run migrations manually:

```bash
python -m app.services.migration_service
```

Current migrations create:
- `users`
- `auth_tokens`
- Google auth columns on `users` (`google_sub`, `auth_provider`)

## CORS
Backend CORS is enabled for local frontend origins by default:
- `http://localhost:8080`
- `http://127.0.0.1:8080`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

To override, set a comma-separated env var before starting backend:

```bash
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

## API Summary
- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/ats/check`
- `POST /api/v1/resume/optimize`
- `POST /api/v1/resume/keyword-gap`
- `POST /api/v1/resume/extract-text` (multipart file upload: PDF/DOCX)

## Authentication
- Register a user from `POST /api/v1/auth/register`
- Login from `POST /api/v1/auth/login` to get `access_token`
- Sign up/login with Google from `POST /api/v1/auth/google` using Google ID token
- Pass token as `Authorization: Bearer <token>` for all tool endpoints:
	- `POST /api/v1/ats/check`
	- `POST /api/v1/resume/optimize`
	- `POST /api/v1/resume/keyword-gap`
	- `POST /api/v1/resume/extract-text`

Tokens currently expire in 24 hours.

## Notes for UAE Market
The scoring model includes UAE-focused checks such as:
- Presence of local market terms (GCC/UAE compliance keywords)
- Optional language and visa/work authorization hints
- Industry-aligned keyword matching for UAE roles
