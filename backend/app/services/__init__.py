"""CampusOS — Services package.

The service layer contains all business logic and orchestrates
calls between repositories, external integrations, and background tasks.

Example structure:
    services/
        user_service.py
        student_service.py
        enrollment_service.py
        notification_service.py
        ...

Services depend on repositories via dependency injection and should
never import directly from endpoint handlers.
"""
