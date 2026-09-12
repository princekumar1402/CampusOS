# ADR-001: Modular Monolith Architecture

| Field | Value |
|-------|-------|
| **Status** | ✅ Accepted |
| **Date** | 2026-09 |
| **Deciders** | Lead Architect |
| **Tags** | architecture, infrastructure |

---

## Context

CampusOS must manage ~20 functional domains (students, faculty, attendance,
events, complaints, internships, AI, etc.). We need to choose a high-level
deployment and code organization architecture before building any features.

The two primary candidates considered were:

1. **Modular Monolith**: Single deployable unit with enforced internal
   domain boundaries.
2. **Microservices from Day 1**: Separate deployable services per domain
   communicating over HTTP/gRPC/message queues.

---

## Decision

We adopt a **Modular Monolith** architecture for the initial product.

---

## Rationale

### Why NOT microservices at this stage

| Problem with Microservices | Impact |
|---|---|
| Requires mature DevOps (Kubernetes, service mesh, distributed tracing) | Not justified for early-phase team |
| Network latency between services | Cross-domain operations (e.g., enroll student → update course → notify) require distributed transactions |
| Data consistency challenges | No cross-service foreign keys; eventual consistency adds complexity |
| Operational overhead | Each service needs its own CI/CD, monitoring, logging, alerting |
| Testing complexity | Integration tests become expensive across service boundaries |
| Team coordination | Conway's Law — small teams get little benefit from full service isolation |

### Why Modular Monolith works here

| Benefit | Details |
|---|---|
| **Simple local dev** | `docker compose up` for infra, `uvicorn` for backend, `npm run dev` for frontend |
| **Single deployment** | One container → fast CI, simple Kubernetes Pod eventually |
| **Shared DB transactions** | Domain operations that touch multiple tables stay ACID without sagas |
| **Refactoring freedom** | Domain boundaries enforced by code organization, not network |
| **Performance** | No serialization/network overhead for in-process domain calls |
| **Observability** | Single structured log stream, single metrics endpoint |

---

## Architecture Constraints Enforced

To preserve domain boundaries despite being a monolith:

1. **No cross-domain direct imports**: Module A does not import from Module B's
   models or repositories. Only services may call other services via
   well-defined interfaces.

2. **Own your tables**: Each domain module owns its SQLAlchemy models.
   Cross-domain relationships use IDs (foreign keys), not ORM relationships
   across modules.

3. **Clean API surface**: Every domain exposes a service class interface.
   Future extraction means replacing service calls with HTTP calls.

4. **Dependency direction**: `Endpoint → Service → Repository → Database`.
   No skipping layers.

---

## Consequences

### Positive
- Fast iteration velocity in early phase
- Simple deployment and operations
- Easy refactoring within domain boundaries
- Full ACID transactions across domains
- Clear extraction path when needed

### Negative
- Long-term, a large monolith can become a "big ball of mud" if discipline lapses
- Scaling individual domains requires scaling the entire application
- Technology heterogeneity is limited (all Python backend)

### Mitigations
- Enforce domain boundaries via code review and linting rules
- High-load modules (AI, notifications) extracted first when needed
- Track domain coupling metrics over time

---

## Extraction Triggers

Extract a domain into a standalone service when **any** of these apply:

- Domain has >50k requests/day and needs independent scaling
- Domain team exceeds 5 engineers
- Domain requires a different technology stack (e.g., Go for performance)
- Domain has strict SLA requirements different from the monolith

The AI layer (`ai/`) is architected as a separate directory from day one
to make this extraction trivial.

---

## Review Date

Revisit this decision when the user base exceeds **10,000 active users** or
the engineering team exceeds **8 engineers**.
