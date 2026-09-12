"""CampusOS — Workers package.

Background task workers (Celery or equivalent) will be defined here.

Example structure:
    workers/
        celery_app.py    ← Celery application instance and config
        tasks/
            email.py     ← Email notification tasks
            reports.py   ← Report generation tasks
            ai.py        ← AI processing tasks (embeddings, matching)
            ...

Workers use Redis as the broker and result backend (configured later).
"""
