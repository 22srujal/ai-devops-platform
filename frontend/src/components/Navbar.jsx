import React from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.logoIcon}>⚡</span>
        <h2 style={styles.title}>AI DevOps Platform</h2>
      </div>
      <div style={styles.links}>
        <button
          style={
            activeTab === "dashboard"
              ? { ...styles.link, ...styles.activeLink }
              : styles.link
          }
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={
            activeTab === "projects"
              ? { ...styles.link, ...styles.activeLink }
              : styles.link
          }
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          style={
            activeTab === "deployments"
              ? { ...styles.link, ...styles.activeLink }
              : styles.link
          }
          onClick={() => setActiveTab("deployments")}
        >
          🚀 Deployments
        </button>
        <button
          style={
            activeTab === "monitoring"
              ? { ...styles.link, ...styles.activeLink }
              : styles.link
          }
          onClick={() => setActiveTab("monitoring")}
        >
          📊 Monitoring
        </button>
        <button
          style={
            activeTab === "ai-review"
              ? { ...styles.link, ...styles.activeLink }
              : styles.link
          }
          onClick={() => setActiveTab("ai-review")}
        >
          🤖 AI Code Review
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#1a1f2c",
    color: "#ffffff",
    borderBottom: "1px solid #2d3748",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  links: {
    display: "flex",
    gap: "0.5rem",
  },
  link: {
    background: "none",
    border: "none",
    color: "#a0aec0",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "0.5rem 0.8rem",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  activeLink: {
    color: "#ffffff",
    backgroundColor: "#2d3748",
    fontWeight: "600",
  },
};
