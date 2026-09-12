# CampusOS — API Documentation

This directory contains API documentation for the CampusOS REST API.

## Interactive Documentation

When the backend is running, interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Versioning

All endpoints are prefixed with `/api/v1/`.

Future breaking changes will introduce `/api/v2/` while maintaining backward
compatibility for a defined deprecation window.

## Currently Implemented Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Application health + dependency checks |
| GET | `/` | API root — links to docs |

## Planned Endpoints (future modules)

Refer to [system-overview.md](../architecture/system-overview.md) for the
full list of planned domain modules.
