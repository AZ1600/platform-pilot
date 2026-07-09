const API_URL = "http://127.0.0.1:8000";

export async function getDashboard() {
  const res = await fetch(`${API_URL}/dashboard`);
  return res.json();
}

export async function getClusterSummary() {
  const res = await fetch(`${API_URL}/cluster-summary`);
  return res.json();
}

export async function getPods() {
  const res = await fetch(`${API_URL}/pods`);
  return res.json();
}

export async function getPodAnalysis(name) {
  const res = await fetch(`${API_URL}/analysis/${name}`);
  return res.json();
}

export async function getDeployments() {
  const res = await fetch(`${API_URL}/deployments`);
  return res.json();
}

export async function getDeployment(name) {
  const res = await fetch(`${API_URL}/deployments/${name}`);
  return res.json();
}

export async function getNodes() {
  const res = await fetch(`${API_URL}/nodes`);
  return res.json();
}

export async function getNode(name) {
  const res = await fetch(`${API_URL}/nodes/${name}`);
  return res.json();
}

export async function getNamespaces() {
  const res = await fetch(`${API_URL}/namespaces`);
  return res.json();
}

export async function getNamespace(name) {
  const res = await fetch(`${API_URL}/namespaces/${name}`);
  return res.json();
}