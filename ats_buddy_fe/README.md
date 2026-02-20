# ATS Buddy Frontend

Frontend for ATS Buddy UAE, including authentication and protected ATS tools.

## Stack
- Vite
- React + TypeScript
- Tailwind CSS
- shadcn-ui

## Development
```sh
npm install
npm run dev
```

## Build
```sh
npm run build
npm run preview
```

## Environment
Create a `.env` file in this folder:

```sh
VITE_API_BASE_URL=http://localhost:8000
```

## API Usage
- Register: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`
- Protected endpoints require `Authorization: Bearer <token>`
- Upload resume text extraction: `POST /api/v1/resume/extract-text` (PDF/DOCX)
