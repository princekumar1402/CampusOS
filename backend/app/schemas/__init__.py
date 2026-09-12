"""CampusOS — Schemas package.

Pydantic request/response schemas organized by domain module.

Example structure:
    schemas/
        common.py        ← Shared schemas (pagination, timestamps, etc.)
        health.py        ← Health check response schemas
        user.py          ← Auth / user schemas
        student.py       ← Student schemas
        ...
"""
