import {
  useEffect,
  useState,
} from "react";

import {
  clearApiToken,
  getApiToken,
  setApiToken,
} from "../services/auth";

import {
  validateApiToken,
} from "../services/api";


function ApiAccess() {
  const [open, setOpen] =
    useState(false);

  const [token, setToken] =
    useState("");

  const [principal, setPrincipal] =
    useState(null);

  const [checking, setChecking] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {
    let cancelled = false;

    async function verifyStoredToken() {
      const storedToken =
        getApiToken();

      if (!storedToken) {
        setChecking(false);
        return;
      }

      try {
        const authenticatedPrincipal =
          await validateApiToken(
            storedToken
          );

        if (!cancelled) {
          setPrincipal(
            authenticatedPrincipal
          );
        }
      } catch {
        clearApiToken();

        if (!cancelled) {
          setPrincipal(null);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    verifyStoredToken();

    return () => {
      cancelled = true;
    };
  }, []);


  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const authenticatedPrincipal =
        await validateApiToken(token);

      setApiToken(token);

      setPrincipal(
        authenticatedPrincipal
      );

      setToken("");
      setOpen(false);

      window.location.reload();
    } catch (submissionError) {
      setError(
        submissionError.message
      );
    } finally {
      setSaving(false);
    }
  }


  function handleClear() {
    clearApiToken();

    setPrincipal(null);
    setToken("");
    setError("");
    setOpen(false);

    window.location.reload();
  }


  const authenticated =
    Boolean(principal);


  return (
    <div className="api-access">
      <button
        type="button"
        className={`api-access-button ${
          authenticated
            ? "connected"
            : ""
        }`}
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        disabled={checking}
      >
        {checking
          ? "Checking API..."
          : authenticated
            ? `API Access ✓ · ${principal.role}`
            : "API Access"}
      </button>

      {open && (
        <div className="api-access-panel">
          <div>
            <strong>
              PlatformPilot API Access
            </strong>

            {authenticated ? (
              <p>
                Authenticated as{" "}
                <strong>
                  {principal.role}
                </strong>.
              </p>
            ) : (
              <p>
                Enter a local viewer,
                operator, or admin bearer
                token.
              </p>
            )}
          </div>

          {!authenticated && (
            <form
              onSubmit={handleSubmit}
            >
              <input
                type="password"
                value={token}
                onChange={(event) =>
                  setToken(
                    event.target.value
                  )
                }
                placeholder="Bearer token"
                autoComplete="off"
                aria-label="PlatformPilot API token"
                disabled={saving}
              />

              {error && (
                <p className="api-access-error">
                  {error}
                </p>
              )}

              <div className="api-access-actions">
                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Validating..."
                    : "Validate & save"}
                </button>
              </div>
            </form>
          )}

          {authenticated && (
            <div className="api-access-actions">
              <button
                type="button"
                className="api-access-clear"
                onClick={handleClear}
              >
                Clear session
              </button>
            </div>
          )}

          <small>
            The token is validated by
            PlatformPilot before it is stored
            in sessionStorage. It is not
            included in the frontend build.
          </small>
        </div>
      )}
    </div>
  );
}


export default ApiAccess;