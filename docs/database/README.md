# CampusOS — Database Documentation

This directory documents the CampusOS database schema and migration strategy.

## Database Engine

**PostgreSQL 16** — Primary relational database.

## Migration Tool

**Alembic** — Schema migrations managed in `backend/alembic/versions/`.

## Running Migrations

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "add users table"

# Rollback one step
alembic downgrade -1

# View current state
alembic current
```

## Schema Status

The database schema is **currently empty** (foundation only).

Domain models and their migrations will be added in subsequent phases:

| Domain | Schema Status |
|--------|--------------|
| Auth / Users | 🔜 Planned |
| Students | 🔜 Planned |
| Faculty | 🔜 Planned |
| Courses | 🔜 Planned |
| Attendance | 🔜 Planned |
| Events | 🔜 Planned |
| CampusFix | 🔜 Planned |
| Internships | 🔜 Planned |
