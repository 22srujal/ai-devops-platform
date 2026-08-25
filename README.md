# ⚡ AI-Powered DevOps Deployment Platform

[![CI Pipeline](https://github.com/22srujal/ai-devops-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/22srujal/ai-devops-platform/actions)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-8E75B2.svg?logo=google&logoColor=white)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An end-to-end, containerized **AI-assisted DevOps Deployment & Orchestration Platform** built from scratch. It automates testing, real-time LLM-powered security & vulnerability code reviews, Docker build verification, multi-environment deployments, live log streaming, telemetry health monitoring, and instant one-click rollbacks.

Designed with a strict **$0 / Free-First / Local-First** architecture.

---

## 🌟 Key Features

- **🚀 Multi-Stage CI/CD Deployment Engine**: Orchestrates a 4-step pipeline (_Automated Testing → AI Security Scan → Docker Image Build → Synthetic Health Check & Live Deploy_).
- **🤖 Two-Tier AI Code Review Engine**: Integrates live Google Gemini LLM analysis with an automatic zero-latency rule-based AST security analyzer (detects RCE, SQLi, hardcoded tokens, unsanitized inputs, and memory leaks).
- **⏪ One-Click Instant Rollback**: Hot-swaps broken or degraded services back to any previous stable deployment version in `< 15ms` with full audit logging.
- **📊 Real-Time Cluster Telemetry**: Monitors platform latency (sub-millisecond ~0.95ms), database connection health, memory footprint, and synthetic service uptime.
- **🐳 Multi-Container Docker Architecture**: Fully containerized stack (_Frontend, FastAPI Backend, PostgreSQL_) managed with Docker Compose and healthcheck dependency chains.
- **🛡️ Enterprise GitHub Actions CI Pipeline**: Automatically validates pytest unit test suites, ESLint/frontend production build compilation, and Docker image build integrity on every push.

---

## 🏗️ Architecture & Pipeline Flow

```text
[ Developer Push / Trigger ]
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DevOps Control Plane                     │
│                  (FastAPI + PostgreSQL)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Stage 1: CI  │       │ Stage 2: AI  │       │ Stage 3: Build│
│ Pytest Suite │ ────▶ │ Security Gate│ ────▶ │ Docker Image │
│ (12 Tests)   │       │ (Gemini LLM) │       │ Verification │
└──────────────┘       └──────────────┘       └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ Stage 4: Live│
                                              │  Deployment  │
                                              └──────┬───────┘
                                                     │
               ┌─────────────────────────────────────┴─────────────────────────────────────┐
               ▼                                                                           ▼
┌──────────────────────────────┐                                            ┌──────────────────────────────┐
│      Telemetry Monitor       │                                            │    Instant Rollback Engine   │
│ (Latency: ~0.95ms | Uptime)  │                                            │  (Hot-swap back to version)  │
└──────────────────────────────┘                                            └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer                  | Technologies Used                                                                |
| :--------------------- | :------------------------------------------------------------------------------- |
| **Frontend**           | React 18, Vite, JavaScript, Responsive CSS3 Grid/Flexbox                         |
| **Backend**            | Python 3.11/3.14, FastAPI, Uvicorn, Pydantic V2                                  |
| **Database & ORM**     | PostgreSQL 16, SQLAlchemy 2.0, Psycopg3                                          |
| **AI / LLM Review**    | Google Gemini 3.1/2.5 Flash, HTTPX connection pooling, Regex AST security parser |
| **Containerization**   | Docker, Docker Compose, Multi-stage builds, Alpine Linux                         |
| **CI / CD Automation** | GitHub Actions (Unit testing, linting, image build verification)                 |
| **Testing**            | Pytest, FastAPI TestClient, SQLite In-Memory mock DB                             |

---

## 📂 Project Structure

```text
ai-devops-platform/
│
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline (Pytest, Build, Docker checks)
│
├── backend/
│   ├── app/
│   │   ├── ai_service.py        # Two-tier Gemini LLM + Rule-based security reviewer
│   │   ├── database.py          # SQLAlchemy PostgreSQL connection pooling
│   │   ├── deployment_service.py# CI/CD state machine & Instant Rollback engine
│   │   ├── models.py            # Database tables (Projects, Deployments, AIReviews)
│   │   ├── schemas.py           # Pydantic data schemas
│   │   └── main.py              # FastAPI application & REST routing
│   ├── tests/
│   │   ├── test_health.py       # API health check tests
│   │   ├── test_projects.py     # Project management tests
│   │   ├── test_ai_review.py    # AI code vulnerability detection tests
│   │   └── test_deployments.py  # Deployment lifecycle & Rollback tests
│   ├── Dockerfile               # Backend Docker containerization
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Navigation component
│   │   │   └── ProjectCard.jsx  # Reusable project card component
│   │   ├── services/
│   │   │   └── api.js           # Frontend API client
│   │   ├── App.jsx              # Main Dashboard, Deployment, Telemetry & AI Review UI
│   │   └── main.jsx
│   ├── Dockerfile               # Multi-stage production Nginx frontend container
│   ├── nginx.conf               # Nginx reverse proxy configuration
│   └── package.json
│
├── docs/
│   ├── architecture.md          # Architecture deep dive & state machine spec
│   └── api.md                   # REST API documentation
│
├── docker-compose.yml           # Multi-container orchestration (Frontend, Backend, Postgres)
├── .env.example                 # Safe environment configuration template
└── README.md
```

---

## 🚀 Quick Start (Run Locally in 60 Seconds)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- (Optional) Free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### 1. Clone the repository

```bash
git clone https://github.com/22srujal/ai-devops-platform.git
cd ai-devops-platform
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

_(Optionally paste your `GEMINI_API_KEY=AIzaSy...` in `.env`)_

### 3. Spin up the entire platform

```bash
docker compose up --build
```

### 4. Open the Platform

- **DevOps Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running Automated Tests Locally

```bash
cd backend
source venv/bin/activate
pytest -v
```

**Test Coverage (12 Automated Tests Passing):**

- `test_health.py`: Verifies `/` root and `/health` availability and versioning.
- `test_projects.py`: Verifies project creation, retrieval, and 404 error isolation.
- `test_ai_review.py`: Validates detection of SQL injection, leaked secrets, and clean code.
- `test_deployments.py`: Validates CI/CD pipeline execution, instant rollbacks, and telemetry endpoints.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
