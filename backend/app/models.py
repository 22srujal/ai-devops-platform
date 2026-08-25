from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
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
    issues = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    commit_hash = Column(String(40), nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, IN_PROGRESS, SUCCESS, FAILED
    environment = Column(String(50), default="production")
    deployment_url = Column(String(255), nullable=True)
    logs = Column(Text, default="")
    ai_risk = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)