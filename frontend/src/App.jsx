import React, { useState, useEffect } from "react";
import Navbar from "./components/navbar";
import ProjectCard from "./components/ProjectCard";
import { checkHealth, fetchProjects, createProject } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthStatus, setHealthStatus] = useState("Checking...");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for creating a new project
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected project for details view
  const [selectedProject, setSelectedProject] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const health = await checkHealth();
      setHealthStatus(health.status);

      const projectList = await fetchProjects();
      setProjects(projectList);
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
          <button style={styles.refreshBtn} onClick={loadData}>
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error} — Please make sure your FastAPI backend is running at
            http://127.0.0.1:8000
          </div>
        )}

        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <div>
            <div style={styles.grid}>
              {/* Left Column: Create Project Form */}
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>Create New Project</h3>
                <form onSubmit={handleCreateProject} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Authentication Service"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of the service..."
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

              {/* Right Column: Project Overview / Recent */}
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>Recent Projects</h3>
                {loading ? (
                  <p style={styles.mutedText}>Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p style={styles.mutedText}>
                    No projects yet. Create your first project using the form.
                  </p>
                ) : (
                  <div style={styles.projectList}>
                    {projects
                      .slice(-5)
                      .reverse()
                      .map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onSelect={(p) => setSelectedProject(p)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Project Modal / Detail Box */}
            {selectedProject && (
              <div style={styles.detailBox}>
                <div style={styles.detailHeader}>
                  <h3 style={{ margin: 0 }}>
                    Project Details: {selectedProject.name}
                  </h3>
                  <button
                    style={styles.closeBtn}
                    onClick={() => setSelectedProject(null)}
                  >
                    ✕ Close
                  </button>
                </div>
                <p style={{ color: "#cbd5e1" }}>
                  <strong>ID:</strong> {selectedProject.id}
                </p>
                <p style={{ color: "#cbd5e1" }}>
                  <strong>Description:</strong>{" "}
                  {selectedProject.description || "N/A"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
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
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={(p) => setSelectedProject(p)}
                  />
                ))}
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
    margin: "0 0 1.25rem 0",
    fontSize: "1.2rem",
    color: "#f8fafc",
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
    marginTop: "0.5rem",
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
  detailBox: {
    marginTop: "1.5rem",
    backgroundColor: "#1e293b",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    padding: "1.5rem",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};
