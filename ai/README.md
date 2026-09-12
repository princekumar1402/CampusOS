# CampusOS AI Layer

> **Status:** 🔜 Not yet implemented — Foundation placeholder only

---

## Overview

The `ai/` directory contains all AI and machine learning components for CampusOS.
It is intentionally separated from the main backend application to enable
independent development, testing, and eventual extraction as a standalone service.

---

## Planned Components

### `embeddings/`
Converts text documents into vector embeddings for semantic search and RAG.

- Document chunking and preprocessing
- Embedding model integration (OpenAI `text-embedding-3-small` or local models)
- Batch embedding pipeline
- Embedding storage (PostgreSQL with pgvector or Pinecone)

### `rag/`
Retrieval-Augmented Generation pipeline.

- Document ingestion (PDFs, syllabi, policies, FAQs)
- Vector similarity search
- Context augmentation for LLM prompts
- Answer generation with source citations

### `agents/`
Multi-step AI reasoning agents.

- Campus AI Assistant — answers queries about courses, events, policies
- Internship Matching Agent — matches student profiles to internship listings
- Academic Advisory Agent — course recommendations

---

## Integration Points

| Component | Used By |
|-----------|---------|
| Embeddings | Celery workers (batch jobs), RAG pipeline |
| RAG Pipeline | Campus AI Assistant endpoint |
| Agents | AI Assistant API (`/api/v1/ai/`) |
| Matching Engine | Internship module (`/api/v1/internships/match`) |

---

## LLM Providers (Planned)

- **OpenAI** (GPT-4o) — Primary
- **Ollama** — Local/offline fallback
- **Anthropic Claude** — Optional

---

## Implementation Notes

- All AI calls go through an abstraction layer (strategy pattern) for provider swappability
- AI operations are async and use timeouts to protect API response times
- Heavy AI jobs (embedding ingestion) run via Celery workers, not inline
- Costs are tracked per API call for observability

---

## Getting Started (When Implemented)

```bash
cd ai/
pip install -r requirements.txt
# Configure OPENAI_API_KEY in .env
python embeddings/ingest.py --source docs/
```
