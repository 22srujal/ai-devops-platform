from sqlalchemy import Column, Integer, String, Text  # type: ignore[reportMissingImports]

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)