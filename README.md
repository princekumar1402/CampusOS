# CampusOS

<div align="center">

**Unified Digital Campus Platform**

*Bringing academics, campus services, career tools, and AI-powered features together for universities.*

![Status](https://img.shields.io/badge/status-foundation-amber)
![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20Python-009688)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2014-black)
![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## 📖 Project Vision

CampusOS is a **production-grade university management system** designed as a
full-stack + AI + system-design internship-level project. It provides a unified
digital experience for students, faculty, administrators, and staff.

---

## ✅ Currently Implemented

| Component | Status |
|-----------|--------|
| Project architecture & folder structure | ✅ Done |
| FastAPI backend with versioned API (`/api/v1/`) | ✅ Done |
| `GET /api/v1/health` endpoint (DB + Redis checks) | ✅ Done |
| PostgreSQL configuration (SQLAlchemy async) | ✅ Done |
| Redis configuration | ✅ Done |
| Alembic migration infrastructure | ✅ Done |
| Centralized error handling | ✅ Done |
| Structured logging | ✅ Done |
| Next.js 14 frontend with TypeScript + Tailwind | ✅ Done |
| TanStack Query (data-fetching foundation) | ✅ Done |
| API client (axios with interceptors) | ✅ Done |
| Professional landing page | ✅ Done |
| Reusable UI components (Button, Badge, Card) | ✅ Done |
| Docker Compose (PostgreSQL + Redis) | ✅ Done |
| Architecture documentation + Mermaid diagrams | ✅ Done |
| ADR-001: Modular Monolith decision | ✅ Done |

## 🔜 Planned Modules (Not Yet Implemented)

| Module | Status |
|--------|--------|
| Authentication & RBAC (JWT) | 🔜 Planned |
| Student profiles & management | 🔜 Planned |
| Faculty profiles & management | 🔜 Planned |
| Departments & organizational structure | 🔜 Planned |
| Course catalogue & timetable | 🔜 Planned |
| Enrollment management | 🔜 Planned |
| Attendance tracking | 🔜 Planned |
| Assignments & submissions | 🔜 Planned |
| Exams & grading | 🔜 Planned |
| Events & clubs | 🔜 Planned |
| CampusFix complaint management | 🔜 Planned |
| Notification system | 🔜 Planned |
| Internship listings & applications | 🔜 Planned |
| AI internship matching | 🔜 Planned |
| Campus AI assistant (RAG) | 🔜 Planned |
| Admin analytics dashboards | 🔜 Planned |
| System monitoring | 🔜 Planned |

---

## 🏗️ Architecture

CampusOS uses a **Modular Monolith** architecture — a single deployable unit
with rigorously enforced domain boundaries. This enables fast iteration today
while preserving the ability to extract high-load modules into microservices
when justified by traffic or team size.

```
Next.js (Frontend)
       │
       │  REST / JSON
       ▼
FastAPI /api/v1/  ←── CORS, Auth Middleware (future)
       │
       ▼
Domain Modules  (auth, students, faculty, courses, …)
       │
       ▼
Service Layer  ←── Redis (cache)
       │
       ▼
Repository Layer
       │
       ▼
PostgreSQL          Redis    Celery    Object Storage    Vector DB    LLM
```

See [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md)
for the full diagram and [`docs/decisions/ADR-001-modular-monolith.md`](docs/decisions/ADR-001-modular-monolith.md)
for the architectural decision record.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework with SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| TanStack Query | Server state & data fetching |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async Python web framework |
| Python 3.11 | Primary language |
| Pydantic v2 | Data validation & settings |
| SQLAlchemy 2 (async) | ORM & database access |
| Alembic | Database migrations |
| Uvicorn | ASGI server |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Primary relational database |
| Redis 7 | Caching, queues, rate limiting |
| Celery | Background task workers (planned) |
| Docker / Docker Compose | Containerization |

### AI (Planned)
| Technology | Purpose |
|---|---|
| OpenAI / Ollama | LLM for AI assistant |
| pgvector | Vector embeddings in PostgreSQL |
| RAG pipeline | Knowledge base retrieval |

---

## 📁 Repository Structure

```
CampusOS/
├── frontend/                    # Next.js 14 application
│   ├── app/                     # App Router pages & layouts
│   ├── components/ui/           # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # API client and utilities
│   ├── services/                # Domain service modules
│   └── types/                   # Shared TypeScript types
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── api/v1/              # Versioned API endpoints
│   │   │   └── endpoints/       # Endpoint handlers
│   │   ├── core/                # Config, DB, Redis, logging, errors
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── repositories/        # Data access layer
│   │   ├── services/            # Business logic layer
│   │   ├── workers/             # Celery background tasks
│   │   ├── integrations/        # External service clients
│   │   └── main.py              # FastAPI application factory
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest test suite
│   ├── requirements/            # Pinned dependencies
│   └── pyproject.toml           # Tool configuration
│
├── ai/                          # AI / ML layer (future)
│   ├── embeddings/              # Embedding models & pipelines
│   ├── rag/                     # RAG pipeline
│   └── agents/                  # AI agents
│
├── infrastructure/              # Docker & deployment
│   └── docker/                  # Production Dockerfiles
│
├── docs/                        # Documentation
│   ├── architecture/            # System design docs + diagrams
│   ├── decisions/               # Architecture Decision Records
│   ├── api/                     # API documentation
│   ├── database/                # Schema documentation
│   └── development/             # Dev setup guides
│
├── scripts/                     # Dev utility scripts
├── .env.example                 # Environment variable template
├── docker-compose.yml           # Development infrastructure
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop

### Step 1 — Clone & configure environment

```bash
git clone <repository-url>
cd CampusOS
cp .env.example .env
# Edit .env — update POSTGRES_PASSWORD, REDIS_PASSWORD, etc.
```

### Step 2 — Start infrastructure services

```bash
docker compose up -d
```

Verify services are healthy:
```bash
docker compose ps
```

### Step 3 — Start the backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/api/v1/health |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in values. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | *(required)* |
| `REDIS_PASSWORD` | Redis password | *(required)* |
| `SECRET_KEY` | App secret key | *(required — use `openssl rand -hex 32`)* |
| `DATABASE_URL` | Full DB URL | Auto-assembled |
| `REDIS_URL` | Full Redis URL | Auto-assembled |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:8000` |

---

## 🐳 Docker Commands

```bash
# Start all infrastructure services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v

# View logs
docker compose logs -f postgres
docker compose logs -f redis

# Check service health
docker compose ps
```

---

## 🧪 Testing

### Backend tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
pytest tests/ -v --cov=app --cov-report=html  # with coverage
```

### Frontend type check

```bash
cd frontend
npm run build   # TypeScript type check + build
npm run lint    # ESLint
```

---

## 📚 API Documentation

Interactive API documentation is auto-generated by FastAPI:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 🗺️ System Design Roadmap

```
Phase 1 (Now):
  Modular Monolith + Foundation
  FastAPI + Next.js + PostgreSQL + Redis

Phase 2 (Next):
  Authentication + RBAC
  Core domain modules (Students, Faculty, Courses, Attendance)
  Background workers (Celery)

Phase 3:
  Campus services (Events, CampusFix, Notifications)
  Career platform (Internships)

Phase 4:
  AI layer (RAG, Campus Assistant, Internship Matching)
  Admin analytics dashboards

Phase 5 (Scale):
  Read replicas for PostgreSQL
  AI service extraction (standalone container)
  Notifications service extraction
  CDN + edge caching
```

---

## 📄 License

MIT — see [LICENSE](LICENSE).
