from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)


class AIReview(Base):
    __tablename__ = "ai_reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True)
    risk_level = Column(String(20), nullable=False)
    summary = Column(Text, nullable=False)
    issues = Column(Text, nullable=False)          # Stored as JSON string
    recommendations = Column(Text, nullable=False) # Stored as JSON string
    code_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)