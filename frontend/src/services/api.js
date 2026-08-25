const API_BASE_URL = "http://localhost:8000";

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

export async function fetchMonitoringHealth() {
  const response = await fetch(`${API_BASE_URL}/monitoring/health`);
  if (!response.ok) throw new Error("Failed to fetch monitoring metrics");
  return response.json();
}

export async function fetchProjects() {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
}

export async function createProject(projectData) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) throw new Error("Failed to create project");
  return response.json();
}

export async function requestAIReview(codeSnippet, projectId = null) {
  const response = await fetch(`${API_BASE_URL}/ai/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code_snippet: codeSnippet, project_id: projectId }),
  });
  if (!response.ok) throw new Error("AI Review request failed");
  return response.json();
}

export async function fetchAIReviews() {
  const response = await fetch(`${API_BASE_URL}/ai/reviews`);
  if (!response.ok) throw new Error("Failed to fetch review history");
  return response.json();
}

export async function triggerDeployment(projectId, environment = "production") {
  const response = await fetch(`${API_BASE_URL}/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, environment }),
  });
  if (!response.ok) throw new Error("Deployment failed to start");
  return response.json();
}

export async function fetchDeployments() {
  const response = await fetch(`${API_BASE_URL}/deployments`);
  if (!response.ok) throw new Error("Failed to fetch deployments");
  return response.json();
}

export async function rollbackDeployment(deploymentId) {
  const response = await fetch(
    `${API_BASE_URL}/deployments/${deploymentId}/rollback`,
    {
      method: "POST",
    },
  );
  if (!response.ok) throw new Error("Rollback failed");
  return response.json();
}
