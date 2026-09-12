"""
CampusOS — Structured Logging
==============================
Configures Python's standard logging with structured, JSON-friendly output
in production and human-readable output in development.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

from app.core.config import settings


class _ColourFormatter(logging.Formatter):
    """Coloured formatter for local development readability."""

    GREY = "\x1b[38;5;246m"
    BLUE = "\x1b[38;5;117m"
    YELLOW = "\x1b[38;5;220m"
    RED = "\x1b[38;5;196m"
    BOLD_RED = "\x1b[31;1m"
    RESET = "\x1b[0m"

    _LEVEL_COLOURS: dict[int, str] = {
        logging.DEBUG: GREY,
        logging.INFO: BLUE,
        logging.WARNING: YELLOW,
        logging.ERROR: RED,
        logging.CRITICAL: BOLD_RED,
    }

    def format(self, record: logging.LogRecord) -> str:
        colour = self._LEVEL_COLOURS.get(record.levelno, self.RESET)
        record.levelname = f"{colour}{record.levelname:<8}{self.RESET}"
        return super().format(record)


def configure_logging() -> None:
    """Set up application-wide logging configuration.

    Call this once at application startup (inside ``lifespan``).
    """
    log_level = logging.DEBUG if settings.debug else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    if settings.is_development:
        fmt = "%(asctime)s | %(levelname)s | %(name)s — %(message)s"
        datefmt = "%H:%M:%S"
        handler.setFormatter(_ColourFormatter(fmt=fmt, datefmt=datefmt))
    else:
        # Production: plain text; replace with structlog/JSON handler when ready
        fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"
        handler.setFormatter(logging.Formatter(fmt=fmt))

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine", "httpx"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger scoped to the given module/class."""
    return logging.getLogger(name)
