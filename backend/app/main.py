from fastapi import Depends, FastAPI, HTTPException  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]

from .database import Base, engine, get_db
from .models import Project
from .schemas import ProjectCreate, ProjectResponse


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI DevOps Platform API",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "AI DevOps Platform API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    new_project = Project(
        name=project.name,
        description=project.description,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project