const API_URL = "http://127.0.0.1:8000";

export async function getDashboard() {
  const response = await fetch(`${API_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Unable to load dashboard");
  }

  return response.json();
}