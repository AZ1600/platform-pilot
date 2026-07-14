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

export async function getPodLogs(name) {
  const response = await fetch(`${API_URL}/logs/${name}`);
  return response.json();
}

export async function getPrometheusHealth() {
  const response = await fetch(
    "http://127.0.0.1:8000/metrics/health"
  );

  if (!response.ok) {
    throw new Error("Unable to load Prometheus health.");
  }

  return response.json();
}

export async function getPrometheusPodMetrics() {
  const response = await fetch(
    "http://127.0.0.1:8000/metrics/pods"
  );

  if (!response.ok) {
    throw new Error("Unable to load Prometheus pod metrics.");
  }

  return response.json();
}

export async function getPrometheusClusterMetrics() {
  const response = await fetch(
    "http://127.0.0.1:8000/metrics/cluster"
  );

  if (!response.ok) {
    throw new Error("Unable to load Prometheus cluster metrics.");
  }

  return response.json();
}

export async function getPrometheusNamespaceMetrics() {
  const response = await fetch(
    "http://127.0.0.1:8000/metrics/pods/namespaces"
  );

  if (!response.ok) {
    throw new Error("Unable to load namespace metrics.");
  }

  return response.json();
}

export async function getAiSummary() {
  const response = await fetch(
    "http://127.0.0.1:8000/ai/summary"
  );

  if (!response.ok) {
    throw new Error("Unable to load AI cluster summary.");
  }

  return response.json();
}

export async function getGlobalSearchData() {
  const [pods, deployments, nodes, namespaces] = await Promise.all([
    getPods(),
    getDeployments(),
    getNodes(),
    getNamespaces(),
  ]);

  return {
    pods: Array.isArray(pods) ? pods : pods?.items || [],
    deployments: Array.isArray(deployments)
      ? deployments
      : deployments?.items || [],
    nodes: Array.isArray(nodes) ? nodes : nodes?.items || [],
    namespaces: Array.isArray(namespaces)
      ? namespaces
      : namespaces?.items || [],
  };
}