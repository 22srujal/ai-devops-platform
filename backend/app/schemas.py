from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AIReviewRequest(BaseModel):
    code_snippet: str
    project_id: Optional[int] = None


class AIReviewResponse(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    provider: Optional[str] = "ai-engine"
    risk_level: str
    summary: str
    issues: List[str]
    recommendations: List[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeploymentCreate(BaseModel):
    project_id: int
    commit_hash: Optional[str] = None
    environment: Optional[str] = "production"


class DeploymentResponse(BaseModel):
    id: int
    project_id: int
    commit_hash: str
    status: str
    environment: str
    deployment_url: Optional[str] = None
    logs: Optional[str] = None
    ai_risk: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True