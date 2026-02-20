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
- `POST /api/v1/ats/check`
- `POST /api/v1/resume/optimize`
- `POST /api/v1/resume/keyword-gap`
- `POST /api/v1/resume/extract-text` (multipart file upload: PDF/DOCX)

## Authentication
- Register a user from `POST /api/v1/auth/register`
- Login from `POST /api/v1/auth/login` to get `access_token`
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
