"""CampusOS — Repositories package.

The repository layer abstracts all database I/O from the service layer.
Each domain module will have a corresponding repository.

Example structure:
    repositories/
        base.py          ← Generic CRUD base repository
        user.py
        student.py
        ...

Pattern:
    class StudentRepository(BaseRepository[Student]):
        async def find_by_roll_number(self, roll: str) -> Student | None:
            ...
"""
