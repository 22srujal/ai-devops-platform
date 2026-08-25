from typing import List
from fastapi import FastAPI, Depends, HTTPException  # type: ignore[import-not-found]
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Project
from .schemas import ProjectCreate, ProjectResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI DevOps Platform API",
    version="0.1.0",
)

# Enable CORS for React frontend (Vite default port is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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


@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return projects


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