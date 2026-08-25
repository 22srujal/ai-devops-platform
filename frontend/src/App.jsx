import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import ProjectCard from "./components/ProjectCard.jsx";
import {
  checkHealth,
  fetchProjects,
  createProject,
  requestAIReview,
  fetchAIReviews,
} from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Review state
  const [codeSnippet, setCodeSnippet] = useState(
    `@app.get("/users/{id}")
def get_user(id: int):
    # Potential SQL vulnerability example:
    query = f"SELECT * FROM users WHERE id={id}"
    return db.execute(query)`,
  );
  const [aiReviewResult, setAiReviewResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const health = await checkHealth();
      setHealthStatus(health.status);

      const projectList = await fetchProjects();
      setProjects(projectList);

      const reviews = await fetchAIReviews();
      setReviewHistory(reviews);
    } catch (err) {
      setError(err.message || "Failed to connect to backend");
      setHealthStatus("unhealthy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const newProj = await createProject({ name, description });
      setProjects((prev) => [...prev, newProj]);
      setName("");
      setDescription("");
    } catch (err) {
      alert("Error creating project: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRunAIReview(e) {
    e.preventDefault();
    if (!codeSnippet.trim()) return;

    try {
      setIsAnalyzing(true);
      const result = await requestAIReview(codeSnippet);
      setAiReviewResult(result);
      setReviewHistory((prev) => [result, ...prev]);
    } catch (err) {
      alert("Error running AI review: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function getRiskBadgeColor(risk) {
    switch (risk?.toUpperCase()) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#d97706";
      case "LOW":
        return "#16a34a";
      default:
        return "#64748b";
    }
  }

  return (
    <div style={styles.container}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={styles.main}>
        {/* Status Bar */}
        <div style={styles.statusBar}>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Backend Status:</span>
            <span
              style={{
                ...styles.statusIndicator,
                color: healthStatus === "healthy" ? "#10b981" : "#ef4444",
              }}
            >
              ● {healthStatus.toUpperCase()}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Total Projects:</span>
            <span style={styles.statusValue}>{projects.length}</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>AI Reviews Run:</span>
            <span style={styles.statusValue}>{reviewHistory.length}</span>
          </div>
          <button style={styles.refreshBtn} onClick={loadData}>
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error} — Ensure your FastAPI backend is running at
            http://localhost:8000
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div style={styles.grid}>
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>Create New Project</h3>
              <form onSubmit={handleCreateProject} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payment Service"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={styles.textarea}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  style={styles.submitBtn}
                >
                  {isSubmitting ? "Creating..." : "+ Create Project"}
                </button>
              </form>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>Recent Projects</h3>
              {loading ? (
                <p style={styles.mutedText}>Loading projects...</p>
              ) : projects.length === 0 ? (
                <p style={styles.mutedText}>
                  No projects yet. Create one using the form.
                </p>
              ) : (
                <div style={styles.projectList}>
                  {projects
                    .slice(-5)
                    .reverse()
                    .map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === "projects" && (
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>All Projects ({projects.length})</h3>
            {loading ? (
              <p style={styles.mutedText}>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p style={styles.mutedText}>
                No projects registered in the database.
              </p>
            ) : (
              <div style={styles.gridCards}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI CODE REVIEW */}
        {activeTab === "ai-review" && (
          <div>
            <div style={styles.grid}>
              {/* Input Code Form */}
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>
                  🤖 AI Code Review & Security Analysis
                </h3>
                <p style={styles.subText}>
                  Paste any code snippet or git diff below. The AI will inspect
                  it for security vulnerabilities, bad practices, and bugs.
                </p>
                <form onSubmit={handleRunAIReview} style={styles.form}>
                  <textarea
                    rows={12}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    style={{
                      ...styles.textarea,
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzing || !codeSnippet.trim()}
                    style={styles.aiBtn}
                  >
                    {isAnalyzing ? "Analyzing Code..." : "⚡ Run AI Review"}
                  </button>
                </form>
              </div>

              {/* Review Results */}
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>Analysis Result</h3>
                {isAnalyzing ? (
                  <p style={styles.mutedText}>
                    Running AI analysis and security scan...
                  </p>
                ) : !aiReviewResult ? (
                  <p style={styles.mutedText}>
                    Click "Run AI Review" to see the security evaluation.
                  </p>
                ) : (
                  <div>
                    <div style={styles.reviewHeader}>
                      <span
                        style={{
                          ...styles.riskBadge,
                          backgroundColor: getRiskBadgeColor(
                            aiReviewResult.risk_level,
                          ),
                        }}
                      >
                        Risk Level: {aiReviewResult.risk_level}
                      </span>
                      <span style={styles.providerTag}>
                        Engine: {aiReviewResult.provider}
                      </span>
                    </div>

                    <p style={styles.summaryText}>
                      <strong>Summary:</strong> {aiReviewResult.summary}
                    </p>

                    <h4 style={styles.sectionHeading}>
                      Detected Issues ({aiReviewResult.issues.length}):
                    </h4>
                    {aiReviewResult.issues.length === 0 ? (
                      <p style={{ color: "#10b981", fontSize: "0.9rem" }}>
                        ✓ No critical vulnerabilities detected.
                      </p>
                    ) : (
                      <ul style={styles.issueList}>
                        {aiReviewResult.issues.map((issue, idx) => (
                          <li key={idx} style={styles.issueItem}>
                            ⚠️ {issue}
                          </li>
                        ))}
                      </ul>
                    )}

                    <h4 style={styles.sectionHeading}>Recommendations:</h4>
                    <ul style={styles.recList}>
                      {aiReviewResult.recommendations.map((rec, idx) => (
                        <li key={idx} style={styles.recItem}>
                          💡 {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* History Table */}
            {reviewHistory.length > 0 && (
              <div style={{ ...styles.panel, marginTop: "2rem" }}>
                <h3 style={styles.panelTitle}>Past Review History</h3>
                <div style={styles.historyList}>
                  {reviewHistory.map((rev, idx) => (
                    <div key={idx} style={styles.historyRow}>
                      <span
                        style={{
                          ...styles.miniBadge,
                          backgroundColor: getRiskBadgeColor(rev.risk_level),
                        }}
                      >
                        {rev.risk_level}
                      </span>
                      <span style={styles.historySummary}>{rev.summary}</span>
                      <span style={styles.historyIssues}>
                        {rev.issues?.length || 0} issue(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    backgroundColor: "#1e293b",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    marginBottom: "2rem",
  },
  statusItem: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  statusIndicator: {
    fontWeight: "700",
    fontSize: "0.95rem",
  },
  statusValue: {
    fontWeight: "700",
    color: "#f8fafc",
  },
  refreshBtn: {
    marginLeft: "auto",
    backgroundColor: "#334155",
    color: "#f8fafc",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  errorBox: {
    backgroundColor: "#7f1d1d",
    color: "#fecaca",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
  },
  gridCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
    marginTop: "1rem",
  },
  panel: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.5rem",
  },
  panelTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1.2rem",
    color: "#f8fafc",
  },
  subText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    marginBottom: "1rem",
    lineHeight: "1.4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: "500",
  },
  input: {
    padding: "0.65rem 0.85rem",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#f8fafc",
    fontSize: "0.95rem",
  },
  textarea: {
    padding: "0.65rem 0.85rem",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#f8fafc",
    fontSize: "0.95rem",
    resize: "vertical",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  aiBtn: {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  mutedText: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  riskBadge: {
    padding: "0.35rem 0.85rem",
    borderRadius: "6px",
    fontWeight: "700",
    fontSize: "0.9rem",
    color: "#ffffff",
  },
  providerTag: {
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
  summaryText: {
    fontSize: "0.95rem",
    color: "#e2e8f0",
    lineHeight: "1.5",
    marginBottom: "1rem",
  },
  sectionHeading: {
    margin: "1rem 0 0.5rem 0",
    fontSize: "0.95rem",
    color: "#cbd5e1",
  },
  issueList: {
    margin: "0",
    paddingLeft: "1.25rem",
    color: "#f87171",
    fontSize: "0.9rem",
  },
  issueItem: {
    marginBottom: "0.4rem",
  },
  recList: {
    margin: "0",
    paddingLeft: "1.25rem",
    color: "#60a5fa",
    fontSize: "0.9rem",
  },
  recItem: {
    marginBottom: "0.4rem",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  historyRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    backgroundColor: "#0f172a",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid #334155",
  },
  miniBadge: {
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#ffffff",
  },
  historySummary: {
    flex: 1,
    fontSize: "0.9rem",
    color: "#e2e8f0",
  },
  historyIssues: {
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
};
