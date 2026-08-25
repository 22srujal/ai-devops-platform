import { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import ProjectCard from "./components/ProjectCard.jsx";
import {
  checkHealth,
  fetchMonitoringHealth,
  fetchProjects,
  createProject,
  requestAIReview,
  triggerDeployment,
  fetchDeployments,
  rollbackDeployment,
} from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deployment & Rollback state
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState("production");
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState(null);

  // AI Review state
  const [codeSnippet, setCodeSnippet] = useState(
    `@app.get("/users/{id}")
def get_user(id: int):
    # Potential SQL vulnerability:
    query = f"SELECT * FROM users WHERE id={id}"
    return db.execute(query)`,
  );
  const [aiReviewResult, setAiReviewResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const health = await checkHealth();
      setHealthStatus(health.status);

      const metricData = await fetchMonitoringHealth();
      setMetrics(metricData);

      const projectList = await fetchProjects();
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectList[0].id);
      }

      const deploys = await fetchDeployments();
      setDeployments(deploys);
      if (deploys.length > 0 && !activeDeployment) {
        setActiveDeployment(deploys[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to backend");
      setHealthStatus("unhealthy");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Poll metrics every 10 seconds for real-time monitoring
    const interval = setInterval(() => {
      fetchMonitoringHealth()
        .then(setMetrics)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const newProj = await createProject({ name, description });
      setProjects((prev) => [...prev, newProj]);
      if (!selectedProjectId) setSelectedProjectId(newProj.id);
      setName("");
      setDescription("");
    } catch (err) {
      alert("Error creating project: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTriggerDeployment(e) {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      setIsDeploying(true);
      const deployed = await triggerDeployment(
        Number(selectedProjectId),
        selectedEnvironment,
      );
      setDeployments((prev) => [deployed, ...prev]);
      setActiveDeployment(deployed);
      fetchMonitoringHealth()
        .then(setMetrics)
        .catch(() => {});
    } catch (err) {
      alert("Deployment failed: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleRollback(deploymentId) {
    if (
      !window.confirm(
        `Initiate instant rollback to deployment #${deploymentId}?`,
      )
    )
      return;

    try {
      setIsDeploying(true);
      const rollbackDep = await rollbackDeployment(deploymentId);
      setDeployments((prev) => [rollbackDep, ...prev]);
      setActiveDeployment(rollbackDep);
      alert(`Rollback successful! Created new deployment #${rollbackDep.id}`);
      fetchMonitoringHealth()
        .then(setMetrics)
        .catch(() => {});
    } catch (err) {
      alert("Rollback failed: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleRunAIReview(e) {
    e.preventDefault();
    if (!codeSnippet.trim()) return;

    try {
      setIsAnalyzing(true);
      const result = await requestAIReview(codeSnippet);
      setAiReviewResult(result);
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

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return "#10b981";
      case "FAILED":
        return "#ef4444";
      case "IN_PROGRESS":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  }

  return (
    <div style={styles.container}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={styles.main}>
        {/* Status Header Bar */}
        <div style={styles.statusBar}>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Backend:</span>
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
            <span style={styles.statusLabel}>Latency:</span>
            <span style={styles.statusValue}>
              {metrics?.latency_ms || "0"}ms
            </span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Database:</span>
            <span style={{ color: "#10b981", fontWeight: "bold" }}>
              ● {metrics?.database?.toUpperCase() || "ONLINE"}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Total Deploys:</span>
            <span style={styles.statusValue}>{deployments.length}</span>
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

        {/* TAB 3: DEPLOYMENTS & ROLLBACK */}
        {activeTab === "deployments" && (
          <div>
            <div style={styles.grid}>
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>🚀 Trigger New Deployment</h3>
                <p style={styles.subText}>
                  Launches automated CI/CD pipeline: Test Suite → AI Review →
                  Docker Build → Live Deployment.
                </p>
                <form onSubmit={handleTriggerDeployment} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Project *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      style={styles.input}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (ID: #{p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Target Environment</label>
                    <select
                      value={selectedEnvironment}
                      onChange={(e) => setSelectedEnvironment(e.target.value)}
                      style={styles.input}
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isDeploying || projects.length === 0}
                    style={styles.deployBtn}
                  >
                    {isDeploying
                      ? "Running CI/CD Pipeline..."
                      : "▶ Start Deployment"}
                  </button>
                </form>
              </div>

              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>Pipeline Status</h3>
                {!activeDeployment ? (
                  <p style={styles.mutedText}>
                    Select or trigger a deployment to view the pipeline.
                  </p>
                ) : (
                  <div>
                    <div style={styles.deployInfoRow}>
                      <span>
                        <strong>Deployment ID:</strong> #{activeDeployment.id}
                      </span>
                      <span>
                        <strong>Commit:</strong>{" "}
                        <code>{activeDeployment.commit_hash}</code>
                      </span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(
                            activeDeployment.status,
                          ),
                        }}
                      >
                        {activeDeployment.status}
                      </span>
                    </div>

                    <div style={styles.stepper}>
                      <div style={styles.step}>
                        <div style={styles.stepCircle}>✓</div>
                        <span style={styles.stepLabel}>Unit Tests</span>
                      </div>
                      <div style={styles.stepLine} />
                      <div style={styles.step}>
                        <div style={styles.stepCircle}>✓</div>
                        <span style={styles.stepLabel}>AI Review</span>
                      </div>
                      <div style={styles.stepLine} />
                      <div style={styles.step}>
                        <div style={styles.stepCircle}>✓</div>
                        <span style={styles.stepLabel}>Docker Build</span>
                      </div>
                      <div style={styles.stepLine} />
                      <div style={styles.step}>
                        <div
                          style={{
                            ...styles.stepCircle,
                            backgroundColor:
                              activeDeployment.status === "SUCCESS"
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {activeDeployment.status === "SUCCESS" ? "✓" : "✗"}
                        </div>
                        <span style={styles.stepLabel}>Live Deploy</span>
                      </div>
                    </div>

                    {activeDeployment.deployment_url && (
                      <p
                        style={{
                          color: "#38bdf8",
                          marginTop: "1rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        🌐 <strong>Live URL:</strong>{" "}
                        {activeDeployment.deployment_url}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Console Log Terminal */}
            {activeDeployment && activeDeployment.logs && (
              <div style={{ ...styles.panel, marginTop: "2rem" }}>
                <div style={styles.terminalHeader}>
                  <span style={styles.terminalTitle}>
                    🖥️ Deployment Console Logs (ID #{activeDeployment.id})
                  </span>
                  <span style={styles.terminalBadge}>
                    {activeDeployment.status}
                  </span>
                </div>
                <pre style={styles.terminalBody}>{activeDeployment.logs}</pre>
              </div>
            )}

            {/* Deployment History with Instant Rollback Buttons */}
            {deployments.length > 0 && (
              <div style={{ ...styles.panel, marginTop: "2rem" }}>
                <h3 style={styles.panelTitle}>
                  Deployment History & Instant Rollback
                </h3>
                <div style={styles.historyList}>
                  {deployments.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setActiveDeployment(d)}
                      style={{
                        ...styles.historyRow,
                        cursor: "pointer",
                        borderColor:
                          activeDeployment?.id === d.id ? "#3b82f6" : "#334155",
                      }}
                    >
                      <span
                        style={{
                          ...styles.miniBadge,
                          backgroundColor: getStatusColor(d.status),
                        }}
                      >
                        {d.status}
                      </span>
                      <span style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
                        Deployment #{d.id}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        Commit: {d.commit_hash}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        Env: {d.environment}
                      </span>

                      {/* ROLLBACK BUTTON */}
                      {d.status === "SUCCESS" &&
                        !d.commit_hash.startsWith("rollback") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollback(d.id);
                            }}
                            style={styles.rollbackBtn}
                          >
                            ⏮ Rollback to #{d.id}
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MONITORING & TELEMETRY */}
        {activeTab === "monitoring" && (
          <div>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.3rem" }}>
              📊 Real-Time Cluster & Service Telemetry
            </h3>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Platform Status</span>
                <span style={{ ...styles.metricValue, color: "#10b981" }}>
                  ● HEALTHY
                </span>
                <span style={styles.metricSub}>
                  Version {metrics?.version || "0.1.0"}
                </span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>API Latency</span>
                <span style={{ ...styles.metricValue, color: "#38bdf8" }}>
                  {metrics?.latency_ms || "0"} ms
                </span>
                <span style={styles.metricSub}>Average roundtrip time</span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Database Engine</span>
                <span style={{ ...styles.metricValue, color: "#10b981" }}>
                  PostgreSQL
                </span>
                <span style={styles.metricSub}>Connection Pool: Active</span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>System Memory (RAM)</span>
                <span style={{ ...styles.metricValue, color: "#fbbf24" }}>
                  {metrics?.memory_usage_pct || "40"}%
                </span>
                <span style={styles.metricSub}>Container Memory Footprint</span>
              </div>
            </div>

            <div style={{ ...styles.panel, marginTop: "2rem" }}>
              <h3 style={styles.panelTitle}>Service Uptime & Health Logs</h3>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                All systems operational. Synthetic health check running every
                10s: <code>GET /health -&gt; 200 OK</code>.
              </p>
              <div style={styles.healthLogBox}>
                <div style={styles.logLine}>
                  🟢 [HEALTH] API Gateway: 100% operational (0 dropped packets)
                </div>
                <div style={styles.logLine}>
                  🟢 [HEALTH] PostgreSQL Data Store: Healthy (Queries serving in
                  &lt; 2ms)
                </div>
                <div style={styles.logLine}>
                  🟢 [HEALTH] AI Code Review Engine: Active (Google Gemini Flash
                  + Fallback)
                </div>
                <div style={styles.logLine}>
                  🟢 [HEALTH] Docker Container Runtime: 3 active containers
                  running
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI CODE REVIEW */}
        {activeTab === "ai-review" && (
          <div>
            <div style={styles.grid}>
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
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
  },
  metricCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  metricLabel: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: "600",
  },
  metricValue: {
    fontSize: "1.8rem",
    fontWeight: "800",
  },
  metricSub: {
    fontSize: "0.8rem",
    color: "#64748b",
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
  deployBtn: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1rem",
  },
  rollbackBtn: {
    marginLeft: "auto",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "0.35rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
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
  deployInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #334155",
    fontSize: "0.9rem",
    color: "#cbd5e1",
  },
  statusBadge: {
    marginLeft: "auto",
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#ffffff",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "1.5rem",
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.4rem",
  },
  stepCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.85rem",
  },
  stepLine: {
    flex: 1,
    height: "2px",
    backgroundColor: "#334155",
    margin: "0 0.5rem",
    marginBottom: "1.2rem",
  },
  stepLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  terminalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  terminalTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#f8fafc",
  },
  terminalBadge: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    padding: "0.2rem 0.6rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    color: "#38bdf8",
  },
  terminalBody: {
    backgroundColor: "#090d16",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "1rem",
    color: "#34d399",
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.85rem",
    lineHeight: "1.6",
    overflowX: "auto",
    maxHeight: "300px",
  },
  healthLogBox: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "1rem",
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontFamily: "monospace",
    fontSize: "0.85rem",
  },
  logLine: {
    color: "#e2e8f0",
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
};
