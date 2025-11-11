# 🎯 KOMETROgo - Metrological Management System

![KOMETROgo](https://img.shields.io/badge/Status-Production-success)
![License](https://img.shields.io/badge/License-Proprietary-red)

Complete and free Metrological Management System developed for B&F Laboratório de Metrologia. Full-stack solution for measurement instrument control, automated calibrations, document management, certificates, and commercial proposals.

## 📋 Table of Contents

- [Overview](#-overview)
- [Monorepo Structure](#-monorepo-structure)
- [Technologies](#-technologies)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

## 🎯 Overview

KOMETROgo is a comprehensive platform that digitizes and automates metrological management processes, eliminating the use of spreadsheets and paper. The system offers:

- ✅ Complete control of measuring instruments
- 📅 Automatic calibration expiration alerts
- 📄 Document management with versioning
- 📊 PDF certificate and proposal generation
- 👥 Client and team management
- 🔔 Automated email notifications

## 📁 Monorepo Structure

```
kometro/
├── bef-landing-page/     # Institutional landing page (Next.js)
├── frontend/             # SPA web application (React + Vite)
├── bef-backend/          # REST API + Workers (Django REST Framework)
└── README.md            # This file
```

### 🌐 bef-landing-page

Institutional landing page for KOMETRO built with Next.js and Tailwind CSS.

**Stack:**
- Next.js
- Tailwind CSS
- Bigspring Light Template

**Main pages:**
- Company history
- Calibration services
- Values and pillars
- Clients and testimonials
- Contact and LGPD (data privacy)

**How to run:**
```bash
cd bef-landing-page
npm install
npm run dev
```

Access: `http://localhost:3000`

### 💻 frontend

SPA web application for metrological management.

**Stack:**
- React 18
- Vite
- Material-UI (MUI)
- React Query (TanStack Query)
- React Router v6
- Recharts
- JWT Authentication

**Module structure:**
- `auth/` - Authentication and password recovery
- `clients/` - Client management
- `documents/` - Document management and versioning
- `assets/` - Instrument management
- `proposals/` - Commercial proposal generation
- `dashboard/` - Dashboards and metrics
- `components/` - Shared components

**How to run:**
```bash
cd frontend
npm install
npm run dev
```

Access: `http://localhost:5173`

**Configuration:**
Copy `public/env.js` and configure:
```javascript
window.VITE_API_URL = 'http://localhost:8000'
```

**Testing:**
```bash
npm test
```

### ⚙️ bef-backend

REST API and asynchronous workers for task processing.

**Stack:**
- Django 4.x
- Django REST Framework
- Celery + Redis
- MySQL
- Docker + Docker Compose
- JWT Authentication
- WeasyPrint (PDF generation)
- AWS S3 / DigitalOcean Spaces

**Main apps:**
- `clientes/` - User management and authentication
- `instrumentos/` - Instrument catalog and instances
- `documentos/` - Documents with versioning and approvals
- `propostas/` - Commercial proposals in PDF
- `avaliacoes/` - Evaluation system
- `equipamentos/` - Auxiliary equipment
- `procedimentos/` - Technical procedures
- `blog/` - Educational content

**How to run (development):**
```bash
cd bef-backend
docker-compose up --build
```

API will be available at: `http://localhost:8000`

**Configuration (.env):**
```env
DEBUG=True
SECRET_KEY=your-secret-key
MYSQL_HOST=localhost
MYSQL_USER=kometro_user
MYSQL_PASSWORD=your-password
MYSQL_NAME=kometro_db
EMAIL_HOST=smtp.kinghost.net
EMAIL_HOST_USER=comercial@envios.rkp.com.br
EMAIL_HOST_PASSWORD=your-email-password
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
DIGITAL_OCEAN_ACCESS_KEY_ID=your-key
DIGITAL_OCEAN_SECRET_ACCESS_KEY=your-secret
SITE=http://localhost:8000
```

**Services included:**
- `web` - Django + Gunicorn
- `celery_worker` - Asynchronous task processing
- `celery_beat` - Periodic task scheduling
- `redis` - Message broker

**Migrations:**
```bash
docker exec web python manage.py migrate
```

**Create superuser:**
```bash
docker exec web python manage.py createsuperuser
```

## 🚀 Technologies

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Material-UI** - UI components
- **React Query** - State management and caching
- **React Router** - Routing
- **Recharts** - Charts and visualizations
- **Jest** - Unit testing

### Backend
- **Django REST Framework** - REST API
- **Celery** - Asynchronous processing
- **Redis** - Broker and cache
- **MySQL** - Database
- **WeasyPrint** - PDF generation
- **Docker** - Containerization
- **JWT** - Authentication

### Landing Page
- **Next.js** - React framework
- **Tailwind CSS** - Styling

## ✨ Features

### 📦 Instrument Management
- Complete catalog of metrological instruments
- Instance control with unique tags
- Calibration history
- Expiration alerts (30 days, 15 days, expired)
- Certificate uploads

### 📄 Document Management
- Document versioning
- Multi-level approval workflow
- Automatic notifications to approvers
- Expiration control
- Secure upload and download

### 📊 Commercial Proposals
- Automatic PDF proposal generation
- Customizable templates
- Automatic email sending
- Proposal history

### 👥 Client Management
- Client and contact registration
- Access control by groups and permissions
- Addresses and contacts
- Interaction history

### 🔔 Automated Notifications
- Calibration expiration emails
- Document approval notifications
- Document expiration alerts
- Password recovery
- Proposal sending

### 📈 Dashboard and Metrics
- Instrument overview
- Calibration status
- Pending documents
- Charts and reports

## 🏁 Getting Started

### Prerequisites

- **Node.js** 18+ (for frontend and landing page)
- **Python** 3.10+ (for backend)
- **Docker** and **Docker Compose** (recommended for backend)
- **MySQL** 8+ (if running backend without Docker)
- **Redis** (if running backend without Docker)

### Complete Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd kometro
```

#### 2. Backend (Docker - Recommended)
```bash
cd bef-backend
cp .env.example .env  # Configure environment variables
docker-compose up --build
```

#### 3. Frontend
```bash
cd frontend
npm install
cp public/env.example.js public/env.js  # Configure API URL
npm run dev
```

#### 4. Landing Page
```bash
cd bef-landing-page
npm install
npm run dev
```

### Development URLs

- **Landing Page**: http://localhost:3000
- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## 🚢 Deployment

### Backend (Production)

Backend is deployed using Docker Compose with:
- Nginx as reverse proxy
- Certbot for SSL (Let's Encrypt)
- Gunicorn as WSGI server
- Celery workers for asynchronous tasks
- Redis for broker

```bash
cd bef-backend
docker-compose -f docker-compose.prod.yml up -d
```

### Frontend

Production build:
```bash
cd frontend
npm run build
```

Files will be in `dist/` ready for deployment to static servers (Netlify, Vercel, etc.)

### Landing Page

Production build:
```bash
cd bef-landing-page
npm run build
```

## 🧪 Testing

### Backend

Integration tests for all email-sending tasks:

```bash
cd bef-backend
docker exec web python manage.py test --keepdb --verbosity=2
```

Specific tests:
```bash
# Client email task tests
docker exec web python manage.py test clientes.tests.test_tasks

# Document task tests
docker exec web python manage.py test documentos.tests.test_tasks

# Instrument task tests
docker exec web python manage.py test instrumentos.tests.test_tasks
```

See [TESTING_EMAIL_TASKS.md](bef-backend/app/TESTING_EMAIL_TASKS.md) for details.

### Frontend

```bash
cd frontend
npm test
```

## 📝 Architecture

### Authentication Flow
1. Frontend sends credentials → Backend
2. Backend validates and returns JWT tokens (access + refresh)
3. Frontend stores tokens in localStorage
4. Requests include token in `Authorization: Bearer <token>` header
5. Token expired? Frontend uses refresh token to renew

### Asynchronous Task Flow
1. API receives request (e.g., send email)
2. API enqueues task in Celery via Redis
3. Celery Worker processes task
4. Result is stored in Redis
5. Logs are recorded for monitoring

### File Upload Flow
1. Frontend uploads → Backend
2. Backend validates and saves to DigitalOcean Spaces (S3-compatible)
3. Public URL is returned
4. Metadata is saved in MySQL

## 🤝 Contributing

This is a proprietary project developed for B&F Laboratório de Metrologia / KOMETRO.

## 📄 License

Proprietary - All rights reserved © 2024-2025 B&F Laboratório de Metrologia

## 👨‍💻 Developed by

**Laisa Rioverde** - Full Stack Developer
- Frontend (React + Vite)
- Backend (Django REST Framework)
- Infrastructure (Docker + AWS)
- DevOps (CI/CD + Monitoring)

---

🌐 **Links**
- Landing Page: https://www.kometro.com.br
- App: https://app.kometro.com.br
- LinkedIn: [KOMETRO on LinkedIn](https://linkedin.com/company/kometro)
