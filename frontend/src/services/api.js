const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

export async function fetchProjects() {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
}

export async function fetchProjectById(id) {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch project ${id}`);
  return response.json();
}

export async function createProject(projectData) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) throw new Error("Failed to create project");
  return response.json();
}
