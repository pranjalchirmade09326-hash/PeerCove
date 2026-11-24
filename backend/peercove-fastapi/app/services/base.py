from sqlalchemy.ext.asyncio import AsyncSession


class BaseService:
    """Base class for domain service layer, encapsulating database sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db
