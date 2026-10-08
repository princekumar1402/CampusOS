# CampusOS

<div align="center">

**Unified Digital Campus Platform**

*Bringing academics, campus services, career tools, and AI-powered features together for universities.*

![Status](https://img.shields.io/badge/status-v2.0--feature--complete-emerald)
![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20Python%203.11%2F3.13-009688)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2014%20(App%20Router)-black)
![Database](https://img.shields.io/badge/database-PostgreSQL%2016-336791)
![Cache](https://img.shields.io/badge/cache-Redis%207-red)
![AI](https://img.shields.io/badge/ai-FAISS%20%2B%20RAG-blueviolet)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## 📖 Project Vision

CampusOS is a **production-grade university management system** designed as a full-stack, AI-integrated, modular monolith. It provides a unified digital experience for students, faculty, administrators, and staff by centralizing identity, academics, attendance, campus life, maintenance, career placement, and institutional intelligence.

---

## ✅ Implementation Status

CampusOS has evolved through rapid iterations into a comprehensive, fully functional digital campus platform:

| Module / Component | Status | Description |
|---|---|---|
| **Architecture & Foundation** | ✅ Complete | Modular monolith, SQLAlchemy 2 (async), Redis, Alembic, structured logging, centralized errors |
| **Authentication & RBAC** | ✅ Complete | Argon2id hashing, short-lived JWT, HttpOnly refresh session cookies with rotation, Role-Based Access (`STUDENT`, `FACULTY`, `ADMIN`) |
| **Academic & Profile Directories** | ✅ Complete | Department management, Student profiles (CGPA, semester, skills), Faculty profiles (designation, office hours) |
| **Course & Attendance System** | ✅ Complete | Course catalog, batch session attendance marking (`PRESENT`, `ABSENT`), student self-service percentage & history, faculty roster sheets |
| **Events & Student Clubs** | ✅ Complete | Campus events calendar, one-click RSVPs / registrations, club directory, membership join & leave lifecycle |
| **CampusFix (Complaints)** | ✅ Complete | Maintenance ticketing workflow (`OPEN` → `IN_PROGRESS` → `RESOLVED`), student isolation, admin resolution workflows |
| **In-App Notifications** | ✅ Complete | Real-time notification feed, automated alerts on complaint/application updates, read/unread status management |
| **Career & Internship Portal** | ✅ Complete | Internship listings, algorithmic student skill-overlap matching, application submission & duplicate prevention |
| **Campus AI Assistant (RAG)** | ✅ Complete | Grounded Q&A over campus policy documents using FAISS vector indexing, relevance threshold gating, and source citations |
| **Admin Executive Dashboard** | ✅ Complete | Aggregate analytics & KPI counts across students, faculty, courses, events, complaints, and placements |
| **CampusOS 2.0 Web UI** | ✅ Complete | Modern Next.js 14 App Router client, AppShell, responsive sidebar, light/dark themes, TanStack Query, automatic token refresh |
| **Test Suite & Verification** | ✅ Complete | End-to-end pytest test suite covering all routers, RBAC protections, database transactions, and live verification scripts |
| Assignments & Submissions | 🔜 Roadmap | Course assignment submissions & grading pipeline |
| Exams & Automated Grading | 🔜 Roadmap | Examination schedule & gradebook analytics |
| pgvector / Multi-agent Extraction | 🔜 Roadmap | Native PostgreSQL vector storage and dedicated microservice extraction |

---

## 🔐 Complete API Endpoints Catalog (`/api/v1/`)

### 1. Authentication & RBAC (`/api/v1/auth`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | Register new user account (defaults to `STUDENT`) |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user, issue access token & set HttpOnly refresh cookie |
| `/api/v1/auth/refresh` | `POST` | Public | Rotate refresh token session & issue new access token |
| `/api/v1/auth/logout` | `POST` | Public | Revoke refresh token session and clear cookies |
| `/api/v1/auth/me` | `GET` | Authenticated | Retrieve safe profile of current logged-in user |
| `/api/v1/auth/test-student` | `GET` | `STUDENT`, `ADMIN` | Role verification test endpoint |
| `/api/v1/auth/test-faculty` | `GET` | `FACULTY`, `ADMIN` | Role verification test endpoint |
| `/api/v1/auth/test-admin` | `GET` | `ADMIN` | Role verification test endpoint |

### 2. Academic Management & Profiles (`/api/v1/departments`, `/api/v1/students`, `/api/v1/faculty`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/departments` | `GET` | Authenticated | List all university academic departments |
| `/api/v1/departments` | `POST` | `ADMIN` | Create a new academic department |
| `/api/v1/departments/{id}` | `GET`, `PUT` | Authenticated / `ADMIN` | Retrieve or modify department details |
| `/api/v1/students/me` | `GET`, `PUT` | Authenticated | View or update logged-in student profile |
| `/api/v1/students` | `GET` | Authenticated | Search & browse student directory |
| `/api/v1/students/{id}` | `GET` | Authenticated | Get student profile details by ID |
| `/api/v1/faculty/me` | `GET`, `PUT` | Authenticated | View or update logged-in faculty profile |
| `/api/v1/faculty` | `GET` | Authenticated | Search & browse faculty directory |
| `/api/v1/faculty/{id}` | `GET` | Authenticated | Get faculty profile details by ID |

### 3. Courses & Attendance Management (`/api/v1/courses`, `/api/v1/attendance`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/courses` | `GET` | Authenticated | List all active courses in the catalog |
| `/api/v1/courses` | `POST` | `FACULTY`, `ADMIN` | Create a new course offering |
| `/api/v1/attendance/mark` | `POST` | `FACULTY`, `ADMIN` | Batch record class attendance (`PRESENT`, `ABSENT`, `EXCUSED`, `LATE`) |
| `/api/v1/attendance/me` | `GET` | Authenticated | View personal attendance summary, class totals, and attendance percentage |
| `/api/v1/attendance/course/{id}` | `GET` | `FACULTY`, `ADMIN` | Fetch attendance register & sheet for a course with optional date filter |

### 4. Events & Student Clubs (`/api/v1/events`, `/api/v1/clubs`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/events` | `GET` | Authenticated | List upcoming campus events |
| `/api/v1/events` | `POST` | `FACULTY`, `ADMIN` | Create a new campus event |
| `/api/v1/events/{id}` | `GET` | Authenticated | Get event details by ID |
| `/api/v1/events/my-registrations`| `GET` | Authenticated | List events registered by current student |
| `/api/v1/events/{id}/register` | `POST` | Authenticated | RSVP / Register current student for an event |
| `/api/v1/events/{id}/register` | `DELETE` | Authenticated | Cancel event registration |
| `/api/v1/clubs` | `GET` | Authenticated | List all student clubs |
| `/api/v1/clubs` | `POST` | `ADMIN` | Create a new student club |
| `/api/v1/clubs/{id}` | `GET` | Authenticated | Get club details by ID |
| `/api/v1/clubs/{id}/join` | `POST` | Authenticated | Join a student club |
| `/api/v1/clubs/{id}/join` | `DELETE` | Authenticated | Leave a student club |

### 5. CampusFix Complaints & Notifications (`/api/v1/complaints`, `/api/v1/notifications`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/complaints` | `POST` | `STUDENT` | Submit a maintenance or service complaint |
| `/api/v1/complaints/me` | `GET` | Authenticated | View complaints submitted by current student |
| `/api/v1/complaints` | `GET` | `ADMIN` | List all campus complaints |
| `/api/v1/complaints/{id}` | `GET` | Authenticated | View complaint details (ownership/admin restricted) |
| `/api/v1/complaints/{id}/status`| `PATCH` | `ADMIN` | Update status (`OPEN` → `IN_PROGRESS` → `RESOLVED`) |
| `/api/v1/notifications` | `GET` | Authenticated | Retrieve in-app notifications for authenticated user |
| `/api/v1/notifications/{id}/read`| `PATCH` | Authenticated | Mark a notification as read |

### 6. Career & Internships (`/api/v1/internships`, `/api/v1/applications`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/internships` | `GET` | Authenticated | Browse internships with real-time student skill-matching |
| `/api/v1/internships` | `POST` | `FACULTY`, `ADMIN` | Post a new internship opportunity |
| `/api/v1/internships/{id}` | `GET` | Authenticated | View internship details & required skills |
| `/api/v1/internships/{id}/apply` | `POST` | `STUDENT` | Submit an internship application |
| `/api/v1/applications/me` | `GET` | `STUDENT` | List all applications submitted by current student |

### 7. Campus AI Assistant (RAG) (`/api/v1/assistant`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/assistant/ask` | `POST` | Authenticated | Submit policy question; returns grounded response synthesized via FAISS vector search with source citations |

### 8. Admin Intelligence & System Health (`/api/v1/admin`, `/api/v1/health`)
| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/v1/admin/stats` | `GET` | `ADMIN` | Aggregate metrics (students, faculty, courses, events, complaints, internships) |
| `/api/v1/health` | `GET` | Public | Deep health check (checks PostgreSQL + Redis connections) |

---

## 💻 Frontend Application Structure (CampusOS 2.0)

Built with **Next.js 14 App Router**, TypeScript, Tailwind CSS, and TanStack Query with automatic JWT renewal interceptors:

| Route | View Description |
|---|---|
| `/` | Modern marketing and platform overview landing page |
| `/login` & `/register` | Secure authentication portal with session persistence |
| `/dashboard` | Central dashboard with quick action widgets, metric summaries, and schedule |
| `/dashboard/admin` | Executive administrative control center with live system statistics and KPI monitoring |
| `/dashboard/assistant` | Interactive conversational Campus AI Assistant interface with grounded document citations |
| `/dashboard/attendance` | Attendance intelligence dashboard featuring percentage calculators and status history |
| `/dashboard/departments`| Academic departments browser and details modal |
| `/dashboard/students` | Searchable directory of enrolled students and academic profiles |
| `/dashboard/faculty` | Directory of university professors, designations, and office hours |
| `/dashboard/events` | Campus events feed with one-click RSVP and registration tracking |
| `/dashboard/clubs` | Student organizations showcase with join/leave actions |
| `/dashboard/complaints`| CampusFix ticketing portal for reporting and tracking campus maintenance |
| `/dashboard/internships` | Career opportunities hub with real-time skill compatibility badges |
| `/dashboard/applications`| Student self-service internship application tracker |
| `/dashboard/notifications`| Notification center with read status management |

---

## 🏗️ Architecture

CampusOS adheres to a **Modular Monolith** architecture pattern — a single deployable unit with clearly bounded domain contexts, loose coupling, and strict layered design:

```
                  ┌──────────────────────────────────────────┐
                  │    Next.js 14 Frontend (CampusOS 2.0)    │
                  │  App Router • Tailwind • TanStack Query  │
                  └────────────────────┬─────────────────────┘
                                       │ REST / JSON (JWT + Cookie)
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │          FastAPI Gateway (/api/v1/)      │
                  │   CORS • Auth Middleware • Error Handler │
                  └────────────────────┬─────────────────────┘
                                       │
     ┌──────────────┬──────────────┼──────────────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼              ▼
 ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌─────────┐
 │  Auth   │   │Academic │   │Attendance│   │Events/Club│   │CampusFix │   │ Career  │
 │ & RBAC  │   │ Profiles│   │ & Courses│   │ & RSVPs   │   │ & Alerts │   │ & Jobs  │
 └────┬────┘   └────┬────┘   └────┬─────┘   └─────┬─────┘   └────┬─────┘   └────┬────┘
      │             │             │               │              │              │
      └─────────────┴─────────────┼───────────────┴──────────────┴──────────────┘
                                  ▼
                   ┌──────────────────────────────┐       ┌──────────────────────┐
                   │   FAISS RAG Policy Engine    │       │ Redis 7 Session/     │
                   │  Vector Store + Knowledge    │       │ Cache Layer          │
                   └──────────────┬───────────────┘       └──────────────────────┘
                                  ▼
                   ┌──────────────────────────────┐
                   │     PostgreSQL 16 Engine     │
                   │ (SQLAlchemy 2.0 Async + ORM) │
                   └──────────────────────────────┘
```

For detailed architectural decisions and system specifications, refer to:
- [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md)
- [`docs/architecture/authentication.md`](docs/architecture/authentication.md)
- [`docs/decisions/ADR-001-modular-monolith.md`](docs/decisions/ADR-001-modular-monolith.md)

---

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Asynchronous Python web framework
- **Python 3.11 / 3.13**: Primary language runtime
- **SQLAlchemy 2.0 (Async)**: Type-safe async ORM
- **Alembic**: Database migration version control
- **Pydantic v2**: High-performance request/response validation
- **Argon2-cffi & PyJWT**: Production security, password hashing, and token rotation
- **FAISS & NumPy**: Fast vector similarity retrieval for RAG AI Assistant

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Strict type safety
- **Tailwind CSS**: Modern utility design tokens and responsive styling
- **TanStack Query (React Query)**: Server state caching and synchronization
- **Axios**: HTTP client with request interceptors & automatic refresh flow
- **Lucide Icons**: Consistent UI iconography

### Infrastructure & Storage
- **PostgreSQL 16**: Primary relational database
- **Redis 7**: Session storage and caching
- **Docker Compose**: Containerized multi-service local environment

---

## 📁 Repository Structure

```
CampusOS/
├── frontend/                    # Next.js 14 frontend application
│   ├── app/                     # App Router pages (/dashboard, /login, etc.)
│   ├── components/              # AppShell, Header, Sidebar, and UI widgets
│   ├── hooks/                   # React hooks (useHealthCheck, auth hooks)
│   ├── lib/                     # Axios API client, auth helpers, token interceptors
│   ├── services/                # Domain API client services
│   └── types/                   # TypeScript interfaces and schema types
│
├── backend/                     # FastAPI backend application
│   ├── app/
│   │   ├── api/v1/              # API v1 routes & dependencies
│   │   │   ├── dependencies/    # Auth, session, and role guard dependencies
│   │   │   └── endpoints/       # Domain controllers (auth, attendance, assistant, etc.)
│   │   ├── core/                # Configuration, DB engine, Redis, logging, security
│   │   ├── models/              # SQLAlchemy ORM database models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── repositories/        # Database query abstractions
│   │   ├── services/            # Business logic and RAG service
│   │   └── main.py              # Application factory and lifespan configuration
│   ├── alembic/                 # Database migrations
│   ├── knowledge_base/          # Markdown campus policy documents for RAG
│   ├── tests/                   # Pytest test suite and live verification scripts
│   └── requirements/            # Dependency files (base, dev, prod)
│
├── docs/                        # Architecture diagrams, ADRs, specifications
├── infrastructure/              # Production Dockerfiles and configs
├── docker-compose.yml           # Development Docker Compose file
├── .env.example                 # Environment configuration template
└── README.md                    # Project documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.11+** (or 3.13)
- **Node.js 20+** & npm
- **Docker Desktop**

### Step 1 — Clone & configure environment
```bash
git clone <repository-url>
cd CampusOS
cp .env.example .env
# Set SECRET_KEY, POSTGRES_PASSWORD, and REDIS_PASSWORD in .env
```

### Step 2 — Start PostgreSQL & Redis
```bash
docker compose up -d
docker compose ps
```

### Step 3 — Start the backend
```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4 — Start the frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 URLs & API Documentation

| Service | URL |
|---|---|
| **Frontend Portal** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Interactive Swagger Docs** | http://localhost:8000/docs |
| **ReDoc Documentation** | http://localhost:8000/redoc |
| **Health Check Endpoint** | http://localhost:8000/api/v1/health |

---

## 🧪 Testing & Verification

Run the comprehensive pytest suite covering all modules:

```bash
cd backend
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Run all unit and integration tests
pytest tests/ -v

# Run with test coverage report
pytest tests/ -v --cov=app --cov-report=term-missing
```

Available test modules:
- `test_auth.py` — Argon2id password hashing, JWT creation, refresh cookie rotation, and RBAC guards
- `test_academic.py` — Departments, student profiles, and faculty directories
- `test_attendance.py` & `test_attendance_intelligence.py` — Batch marking, attendance statistics, course rosters
- `test_events_clubs.py` — Event registrations, RSVPs, club memberships
- `test_complaints_notifications.py` — CampusFix ticket lifecycle and in-app alerts
- `test_internships.py` — Internship postings, skill matching calculations, application submissions
- `test_assistant_rag.py` — FAISS vector search, document chunking, grounded answers, relevance thresholding
- `test_admin.py` — Multi-module aggregate statistics and RBAC restrictions

---

## 🗺️ Roadmap & Next Steps

- [x] **Phase 1: Architecture Foundation** (FastAPI, Next.js, PostgreSQL, Redis, Alembic)
- [x] **Phase 2: Identity & Academics** (Argon2id + JWT + Refresh Sessions, RBAC, Profiles, Courses, Attendance)
- [x] **Phase 3: Campus Services & Career** (CampusFix Complaints, Events, Clubs, Internships, Notifications)
- [x] **Phase 4: AI & Administration** (Campus AI Assistant RAG with FAISS, Admin Executive Dashboard, CampusOS 2.0 Web UI)
- [ ] **Phase 5: Academic Depth** (Assignments submission portal, Gradebook analytics, Timetable scheduling)
- [ ] **Phase 6: Scalability & Microservices** (pgvector migration, standalone Celery workers, background asynchronous notifications)

---

## 📄 License

MIT — see [LICENSE](LICENSE).
