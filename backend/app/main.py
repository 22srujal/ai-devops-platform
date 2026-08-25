import json
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Project, AIReview
from .schemas import (
    ProjectCreate,
    ProjectResponse,
    AIReviewRequest,
    AIReviewResponse,
)
from .ai_service import perform_ai_review

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI DevOps Platform API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI DevOps Platform API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------- PROJECT ENDPOINTS ----------------
@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@app.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = Project(name=project.name, description=project.description)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ---------------- AI CODE REVIEW ENDPOINTS ----------------
@app.post("/ai/review", response_model=AIReviewResponse)
def review_code(payload: AIReviewRequest, db: Session = Depends(get_db)):
    # 1. Perform AI / rule-based review
    review_result = perform_ai_review(payload.code_snippet)

    # 2. Persist review into database
    db_review = AIReview(
        project_id=payload.project_id,
        risk_level=review_result["risk_level"],
        summary=review_result["summary"],
        issues=json.dumps(review_result["issues"]),
        recommendations=json.dumps(review_result["recommendations"]),
        code_snippet=payload.code_snippet,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return AIReviewResponse(
        id=db_review.id,
        project_id=db_review.project_id,
        provider=review_result.get("provider", "ai-engine"),
        risk_level=db_review.risk_level,
        summary=db_review.summary,
        issues=review_result["issues"],
        recommendations=review_result["recommendations"],
        created_at=db_review.created_at,
    )


@app.get("/ai/reviews", response_model=List[AIReviewResponse])
def get_reviews(db: Session = Depends(get_db)):
    reviews = db.query(AIReview).order_by(AIReview.id.desc()).limit(20).all()
    results = []
    for r in reviews:
        results.append(
            AIReviewResponse(
                id=r.id,
                project_id=r.project_id,
                risk_level=r.risk_level,
                summary=r.summary,
                issues=json.loads(r.issues) if r.issues else [],
                recommendations=json.loads(r.recommendations) if r.recommendations else [],
                created_at=r.created_at,
            )
        )
    return results