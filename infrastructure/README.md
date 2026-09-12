# CampusOS — Infrastructure

This directory contains Docker configurations, deployment scripts,
and infrastructure-as-code for CampusOS.

## Development

The primary development infrastructure is defined in `docker-compose.yml`
at the repository root.

```bash
# Start infrastructure services (PostgreSQL + Redis)
docker compose up -d

# Stop services
docker compose down

# Stop and remove all volumes (WARNING: deletes data)
docker compose down -v

# View logs
docker compose logs -f postgres
docker compose logs -f redis
```

## Directory Structure

```
infrastructure/
├── docker/          ← Dockerfiles for backend and frontend
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── README.md
```

## Future: Kubernetes

When the application needs to scale beyond a single server, Kubernetes
manifests and Helm charts will be added here.

Planned structure:
```
infrastructure/
├── k8s/
│   ├── base/
│   └── overlays/
│       ├── staging/
│       └── production/
└── helm/
    └── campusOS/
```
