import React from "react";

export default function ProjectCard({ project, onSelect }) {
  return (
    <div style={styles.card} onClick={() => onSelect && onSelect(project)}>
      <div style={styles.header}>
        <h3 style={styles.name}>{project.name}</h3>
        <span style={styles.badge}>ID: #{project.id}</span>
      </div>
      <p style={styles.description}>
        {project.description || "No description provided."}
      </p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#242b3d",
    border: "1px solid #323b4e",
    borderRadius: "8px",
    padding: "1.25rem",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  name: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#f7fafc",
  },
  badge: {
    fontSize: "0.75rem",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "600",
  },
  description: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#a0aec0",
    lineHeight: "1.4",
  },
};
