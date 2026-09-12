# CampusOS — Development Guide

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **Docker Desktop**
- **Git**

## Quick Start

### 1. Clone and configure

```bash
git clone <repository-url>
cd CampusOS
cp .env.example .env
# Edit .env and set real values for POSTGRES_PASSWORD, REDIS_PASSWORD, etc.
```

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

## Code Standards

### Backend (Python)
- Formatting and linting: **Ruff** (`ruff check . && ruff format .`)
- Type checking: **Mypy** (`mypy app/`)
- Tests: **Pytest** (`pytest tests/ -v`)

### Frontend (TypeScript)
- Linting: **ESLint** (`npm run lint`)
- Type checking: **TypeScript** (`npm run build`)

## Adding a New Domain Module

1. Create `app/models/<domain>.py` with SQLAlchemy model
2. Import model in `app/models/__init__.py`
3. Create migration: `alembic revision --autogenerate -m "add <domain> table"`
4. Create `app/schemas/<domain>.py` with Pydantic schemas
5. Create `app/repositories/<domain>_repository.py`
6. Create `app/services/<domain>_service.py`
7. Create `app/api/v1/endpoints/<domain>.py`
8. Mount router in `app/api/v1/router.py`
