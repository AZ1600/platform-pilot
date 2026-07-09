import { useEffect, useState } from "react";
import { getClusterSummary } from "../services/api";

function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getClusterSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <h2 style={{ textAlign: "center" }}>Loading Dashboard...</h2>;
  }

  return (
    <div className="page">

      {/* Header */}

      <div className="hero-card">
        <h1>📊 Dashboard</h1>
        <p>Live Kubernetes Cluster Overview</p>
      </div>

      {/* Cluster Overview */}

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Health Score</h3>
          <h2>{summary.health_score}/100</h2>
        </div>

        <div className="stat-card">
          <h3>Pods</h3>
          <h2>{summary.pods.total}</h2>
          <p>{summary.pods.running} Running</p>
        </div>

        <div className="stat-card">
          <h3>Deployments</h3>
          <h2>{summary.deployments.total}</h2>
          <p>{summary.deployments.healthy} Healthy</p>
        </div>

        <div className="stat-card">
          <h3>Nodes</h3>
          <h2>{summary.nodes.total}</h2>
          <p>{summary.nodes.ready} Ready</p>
        </div>

        <div className="stat-card">
          <h3>Namespaces</h3>
          <h2>{summary.namespaces.total}</h2>
          <p>{summary.namespaces.active} Active</p>
        </div>

        <div className="stat-card">
          <h3>Incidents</h3>
          <h2>{summary.incidents.length}</h2>
        </div>

      </div>

      {/* AI Summary */}

      <div className="card">

        <h2>🤖 AI Cluster Summary</h2>

        <p>{summary.summary}</p>

        <h3>Recommendations</h3>

        <ul>
          {summary.recommendations.map((item, index) => (
            <li key={index}>✅ {item}</li>
          ))}
        </ul>

      </div>

      {/* Recent Events */}

      <div className="card">

        <h2>📅 Recent Cluster Events</h2>

        {summary.recent_events.length === 0 ? (
          <p>No recent cluster events.</p>
        ) : (
          <table className="resource-table">

            <thead>
              <tr>
                <th>Namespace</th>
                <th>Object</th>
                <th>Reason</th>
                <th>Type</th>
              </tr>
            </thead>

            <tbody>

              {summary.recent_events.map((event, index) => (
                <tr key={index}>
                  <td>{event.namespace}</td>
                  <td>{event.object}</td>
                  <td>{event.reason}</td>
                  <td>{event.type}</td>
                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

      {/* Active Incidents */}

      <div className="card">

        <h2>🚨 Active Incidents</h2>

        {summary.incidents.length === 0 ? (
          <p>🎉 No active incidents detected.</p>
        ) : (
          <table className="resource-table">

            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Namespace</th>
                <th>Status</th>
                <th>Severity</th>
              </tr>
            </thead>

            <tbody>

              {summary.incidents.map((incident, index) => (
                <tr key={index}>
                  <td>{incident.type}</td>
                  <td>{incident.name}</td>
                  <td>{incident.namespace}</td>
                  <td>{incident.status}</td>
                  <td>{incident.severity}</td>
                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}

export default Dashboard;