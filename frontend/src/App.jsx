import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  async function loadDashboard() {
    try {
      const response = await fetch("http://127.0.0.1:8000/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="container">
        <h1>🚀 PlatformPilot</h1>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container">
        <h1>Loading PlatformPilot...</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>🚀 PlatformPilot</h1>

      <div className="card">
        <h2>
          Cluster Status{" "}
          {dashboard.cluster_status === "Healthy"
            ? "🟢 Healthy"
            : "🟠 Warning"}
        </h2>
      </div>

      <div className="metrics">
        <div className="metric-card">
          <h3>Pods</h3>
          <h1>{dashboard.pods}</h1>
        </div>

        <div className="metric-card">
          <h3>Deployments</h3>
          <h1>{dashboard.deployments}</h1>
        </div>

        <div className="metric-card">
          <h3>Risks</h3>
          <h1>{dashboard.active_risks}</h1>
        </div>
      </div>

      <div className="card">
        <h2>🚨 Active Incidents</h2>

        {dashboard.incidents.length === 0 ? (
          <p>✅ No active incidents</p>
        ) : (
          dashboard.incidents.map((incident, index) => (
            <div className="incident" key={index}>
              <h2>{incident.name}</h2>

              <p>
                <strong>Status:</strong> {incident.status}
              </p>

              <p>
                <strong>Severity:</strong> {incident.severity}
              </p>

              <p>
                <strong>Root Cause:</strong> {incident.root_cause}
              </p>

              <p>
                <strong>Recommendation:</strong> {incident.recommendation}
              </p>

              <p>
                <strong>Owner:</strong> {incident.owner}
              </p>

              <hr />

              <h3>📅 Kubernetes Events</h3>

              {incident.events.length === 0 ? (
                <p>No events.</p>
              ) : (
                incident.events.map((event, i) => (
                  <div key={i} className="event">
                    <p>
                      <strong>{event.type}</strong> — {event.reason}
                    </p>

                    <p>{event.message}</p>
                  </div>
                ))
              )}

              <hr />

              <h3>📄 Container Logs</h3>

              <pre className="logs">
                {incident.logs.logs
                  ? incident.logs.logs
                  : incident.logs.error}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;