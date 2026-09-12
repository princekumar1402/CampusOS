"""
CampusOS — Centralised Error Handling
=======================================
Defines domain exception hierarchy and FastAPI exception handlers.
All API errors are returned as a consistent JSON envelope:

    {
        "error": "NotFoundError",
        "message": "Resource not found",
        "detail": null          # optional extra context
    }
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse


# =============================================================================
# Domain Exception Hierarchy
# =============================================================================


class CampusOSError(Exception):
    """Base class for all CampusOS application errors."""

    http_status: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "InternalError"

    def __init__(self, message: str = "An unexpected error occurred.", detail: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail


class NotFoundError(CampusOSError):
    """Raised when a requested resource does not exist."""

    http_status = status.HTTP_404_NOT_FOUND
    error_code = "NotFoundError"

    def __init__(self, resource: str = "Resource", detail: Any = None) -> None:
        super().__init__(message=f"{resource} not found.", detail=detail)


class ValidationError(CampusOSError):
    """Raised when business-level validation fails (distinct from Pydantic validation)."""

    http_status = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "ValidationError"


class ConflictError(CampusOSError):
    """Raised when an operation conflicts with existing state."""

    http_status = status.HTTP_409_CONFLICT
    error_code = "ConflictError"


class UnauthorizedError(CampusOSError):
    """Raised when authentication is required but absent."""

    http_status = status.HTTP_401_UNAUTHORIZED
    error_code = "UnauthorizedError"

    def __init__(self, message: str = "Authentication required.", detail: Any = None) -> None:
        super().__init__(message=message, detail=detail)


class ForbiddenError(CampusOSError):
    """Raised when the authenticated user lacks permission."""

    http_status = status.HTTP_403_FORBIDDEN
    error_code = "ForbiddenError"

    def __init__(self, message: str = "You do not have permission to perform this action.", detail: Any = None) -> None:
        super().__init__(message=message, detail=detail)


class ServiceUnavailableError(CampusOSError):
    """Raised when a downstream dependency (DB, Redis, …) is unreachable."""

    http_status = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "ServiceUnavailableError"


# =============================================================================
# Exception Handlers
# =============================================================================


def _error_response(error_code: str, message: str, detail: Any = None, status_code: int = 500) -> ORJSONResponse:
    return ORJSONResponse(
        status_code=status_code,
        content={
            "error": error_code,
            "message": message,
            "detail": detail,
        },
    )


async def campusOS_error_handler(request: Request, exc: CampusOSError) -> ORJSONResponse:
    return _error_response(
        error_code=exc.error_code,
        message=exc.message,
        detail=exc.detail,
        status_code=exc.http_status,
    )


async def unhandled_error_handler(request: Request, exc: Exception) -> ORJSONResponse:
    """Catch-all for any unexpected exceptions — prevents stack traces leaking to clients."""
    return _error_response(
        error_code="InternalError",
        message="An unexpected error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI application instance."""
    app.add_exception_handler(CampusOSError, campusOS_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_error_handler)
