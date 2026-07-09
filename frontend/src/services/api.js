const API = "http://127.0.0.1:8000";

export async function getDashboard() {
  const res = await fetch(`${API}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function getPods() {
  const res = await fetch(`${API}/pods`);
  if (!res.ok) throw new Error("Failed to fetch pods");
  return res.json();
}

export async function getPodAnalysis(podName) {
  const res = await fetch(`${API}/analysis/${podName}`);
  if (!res.ok) throw new Error("Failed to fetch pod analysis");
  return res.json();
}

export async function getDeployments() {
  const res = await fetch(`${API}/deployments`);
  if (!res.ok) throw new Error("Failed to fetch deployments");
  return res.json();
}

export async function getDeployment(deploymentName) {
  const res = await fetch(`${API}/deployments/${deploymentName}`);
  if (!res.ok) throw new Error("Failed to fetch deployment");
  return res.json();
}

export async function getClusterSummary() {
  const res = await fetch(`${API}/cluster-summary`);
  if (!res.ok) throw new Error("Failed to fetch cluster summary");
  return res.json();
}

export async function getNodes() {
  const res = await fetch(`${API}/nodes`);
  if (!res.ok) throw new Error("Failed to fetch nodes");
  return res.json();
}