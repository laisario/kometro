# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

KOMETROgo is a metrological management system for B&F Laboratório de Metrologia — a monorepo with three independent packages:

- `frontend/` — SPA (React + Vite)
- `bef-backend/` — REST API + async workers (Django REST Framework + Celery)
- `bef-landing-page/` — Institutional landing page (Next.js)

Each package is fully independent with its own `node_modules`/virtualenv.

---

## Frontend (`frontend/`)

### Commands
```bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build to dist/
npm run lint         # ESLint with auto-fix
npm test             # Jest tests
npm run test:watch   # Jest in watch mode
npm run test:coverage
```

### Architecture

**Entry point:** `src/main.jsx` — wraps the app in `QueryClientProvider`, `HashRouter`, MUI `ThemeProvider`, `HelmetProvider`, and `SnackbarProvider`.

**Module layout** (feature-based, not component-based):
- `src/auth/` — JWT auth: `AuthProvider`, login pages, `useAuth` hook
- `src/assets/` — Instrument catalog and instances (core domain)
- `src/clients/` — Client CRUD
- `src/documents/` — Document versioning and approval workflows
- `src/proposals/` — Commercial proposal generation (PDF)
- `src/dashboard/` — Metrics and charts
- `src/components/` — Shared UI (form primitives, cards, views)
- `src/routes/` — `MainRouter.jsx` with all route definitions
- `src/theme/` — MUI theme overrides
- `src/api.js` — Axios instances with JWT interceptors and humps transformation

**Key patterns:**
- **Server state via React Query v3** — all API calls go through query/mutation hooks per module
- **snake_case ↔ camelCase auto-conversion** — `humps` library runs in axios request/response interceptors (`src/api.js`); never manually convert casing
- **JWT in localStorage** — set/read inside `AuthProvider`; axios interceptor attaches the Bearer token automatically
- **File uploads** use a separate axios instance (`uploadApi`) with `multipart/form-data`
- **`window.env.API_URL`** is the production API base URL injected via `public/env.js`; `process.env.API_URL` is used in dev

**Styling:** MUI v6 + styled-components + Emotion. Prettier config: 120-char width, single quotes, es5 trailing commas.

**Tests** live in `tests/` (not co-located), split into `tests/components/` and `tests/integration/`. Mocks for react-hook-form and react-query are in `tests/__mocks__/`. Setup file at `tests/setup.js` patches DOM globals.

---

## Backend (`bef-backend/`)

### Commands
```bash
# All commands run inside Docker
docker compose up -d
docker exec web python manage.py test --keepdb --verbosity=2
docker exec web python manage.py test <app>.tests.<module>   # single module
docker exec web python manage.py migrate
docker exec web python manage.py shell
```

Python code quality (run inside container or virtualenv):
```bash
black app/
flake8 app/
isort app/
```

### Architecture

Django apps in `app/`:
- `clientes/` — user accounts, authentication
- `instrumentos/` — instrument catalog + calibration instances
- `documentos/` — document management with multi-level approval
- `propostas/` — commercial proposals; PDF generation via WeasyPrint
- `avaliacoes/` — evaluations
- `ordem_servico/` — service orders
- `rkp_platform/` — Django project root (settings, URLs)

**Services (docker-compose):** `web` (Gunicorn), `celery_worker`, `celery_beat`, `redis`, `mysql`.

**Async tasks:** Celery + Redis handles email (SendGrid via djmail) and PDF generation. New async work should be Celery tasks, not inline request handlers.

**File storage:** DigitalOcean Spaces (S3-compatible) via django-storages + boto3.

**Auth:** JWT via `djangorestframework-simplejwt`. Tokens are short-lived; refresh handled by the frontend.

Required env vars: `SECRET_KEY`, `MYSQL_*`, `EMAIL_HOST*`, `CELERY_BROKER_URL`, `DIGITAL_OCEAN_*`, `SITE`.

---

## Landing Page (`bef-landing-page/`)

### Commands
```bash
npm run dev      # http://localhost:3000
npm run build
npm run export   # Static export
npm run lint
```

Next.js 13 with Tailwind CSS. Content is MDX-based (`content/`). Deployed to Netlify (`netlify.toml`).
