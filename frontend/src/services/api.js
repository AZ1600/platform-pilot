import { getApiToken } from "./auth";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

const API_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");


async function parseError(response, fallbackMessage) {
  try {
    const body = await response.json();

    if (body?.detail) {
      return body.detail;
    }
  } catch {
    // Ignore JSON parsing errors and use fallback.
  }

  return fallbackMessage;
}


export async function validateApiToken(token) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("API token cannot be empty.");
  }

  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${normalizedToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "PlatformPilot authentication failed."
      );
    }

    if (response.status === 503) {
      throw new Error(
        "PlatformPilot authentication is not configured."
      );
    }

    throw new Error(
      await parseError(
        response,
        `Unable to validate token (HTTP ${response.status}).`
      )
    );
  }

  return response.json();
}


async function apiRequest(
  path,
  errorMessage,
  options = {}
) {
  const token = getApiToken();

  const headers = new Headers(
    options.headers || {}
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "PlatformPilot authentication is required."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Your PlatformPilot role is not authorized for this operation."
      );
    }

    throw new Error(
      await parseError(
        response,
        `${errorMessage} (HTTP ${response.status})`
      )
    );
  }

  return response.json();
}


export async function getCurrentPrincipal() {
  const token = getApiToken();

  if (!token) {
    throw new Error(
      "PlatformPilot authentication is required."
    );
  }

  return validateApiToken(token);
}


export async function getDashboard() {
  return apiRequest(
    "/dashboard",
    "Unable to load dashboard."
  );
}


export async function getClusterSummary() {
  return apiRequest(
    "/cluster-summary",
    "Unable to load cluster summary."
  );
}


export async function getPods() {
  return apiRequest(
    "/pods",
    "Unable to load pods."
  );
}


export async function getPod(
  namespace,
  podName
) {
  return apiRequest(
    `/pods/${encodeURIComponent(
      namespace
    )}/${encodeURIComponent(podName)}`,
    "Unable to load pod."
  );
}


export async function getPodAnalysis(
  namespace,
  podName
) {
  return apiRequest(
    `/analysis/${encodeURIComponent(
      namespace
    )}/${encodeURIComponent(podName)}`,
    "Unable to load pod analysis."
  );
}


export async function getDeployments() {
  return apiRequest(
    "/deployments",
    "Unable to load deployments."
  );
}


export async function getDeployment(name) {
  return apiRequest(
    `/deployments/${encodeURIComponent(name)}`,
    "Unable to load deployment."
  );
}


export async function getNodes() {
  return apiRequest(
    "/nodes",
    "Unable to load nodes."
  );
}


export async function getNode(name) {
  return apiRequest(
    `/nodes/${encodeURIComponent(name)}`,
    "Unable to load node."
  );
}


export async function getNamespaces() {
  return apiRequest(
    "/namespaces",
    "Unable to load namespaces."
  );
}


export async function getNamespace(name) {
  return apiRequest(
    `/namespaces/${encodeURIComponent(name)}`,
    "Unable to load namespace."
  );
}


export async function getPodLogs(
  namespace,
  podName
) {
  return apiRequest(
    `/logs/${encodeURIComponent(
      namespace
    )}/${encodeURIComponent(podName)}`,
    "Unable to load pod logs."
  );
}


export async function getPrometheusHealth() {
  return apiRequest(
    "/metrics/health",
    "Unable to load Prometheus health."
  );
}


export async function getPrometheusPodMetrics() {
  return apiRequest(
    "/metrics/pods",
    "Unable to load Prometheus pod metrics."
  );
}


export async function getPrometheusClusterMetrics() {
  return apiRequest(
    "/metrics/cluster",
    "Unable to load Prometheus cluster metrics."
  );
}


export async function getPrometheusNamespaceMetrics() {
  return apiRequest(
    "/metrics/pods/namespaces",
    "Unable to load namespace metrics."
  );
}


export async function getAiSummary() {
  return apiRequest(
    "/ai/summary",
    "Unable to load AI cluster summary."
  );
}


export async function getGlobalSearchData() {
  const [
    pods,
    deployments,
    nodes,
    namespaces,
  ] = await Promise.all([
    getPods(),
    getDeployments(),
    getNodes(),
    getNamespaces(),
  ]);

  return {
    pods: Array.isArray(pods)
      ? pods
      : pods?.items || [],

    deployments: Array.isArray(deployments)
      ? deployments
      : deployments?.items || [],

    nodes: Array.isArray(nodes)
      ? nodes
      : nodes?.items || [],

    namespaces: Array.isArray(namespaces)
      ? namespaces
      : namespaces?.items || [],
  };
}