const STORAGE_KEY = "platformpilot_api_token";

export function getApiToken() {
  return sessionStorage.getItem(STORAGE_KEY) || "";
}

export function setApiToken(token) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("API token cannot be empty.");
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    normalizedToken
  );
}

export function clearApiToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasApiToken() {
  return Boolean(getApiToken());
}