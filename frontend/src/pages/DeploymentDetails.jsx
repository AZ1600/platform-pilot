import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDeployment } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge.jsx";

function DeploymentDetails() {
  const { deploymentName } = useParams();

  const [deployment, setDeployment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeployment(deploymentName);

        if (data.error) {
          setError(data.error);
          return;
        }

        setDeployment(data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [deploymentName]);

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>Error: {error}</h2>
        </div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading deployment...</h2>
        </div>
      </div>
    );
  }

  const pods = deployment.pods || [];
  const conditions = deployment.conditions || [];

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 {deployment.name}</h1>
        <p>
          <strong>Namespace:</strong> {deployment.namespace}
        </p>
      </div>

      <div className="dashboard-grid">
        <MetricCard title="Desired Replicas" value={deployment.replicas} />
        <MetricCard title="Ready Replicas" value={deployment.ready} />
        <MetricCard title="Available" value={deployment.available} />
        <MetricCard title="Pods" value={pods.length} />
      </div>

      <div className="card">
        <h2>📦 Related Pods</h2>

        {pods.length === 0 ? (
          <p>No pods found for this deployment.</p>
        ) : (
          <table className="resource-table">
            <thead>
              <tr>
                <th>Pod</th>
              </tr>
            </thead>

            <tbody>
              {pods.map((pod) => (
                <tr key={pod}>
                  <td>
                    <Link to={`/pods/${pod}`}>{pod}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>📋 Deployment Conditions</h2>

        {conditions.length === 0 ? (
          <p>No deployment conditions found.</p>
        ) : (
          <table className="resource-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Message</th>
              </tr>
            </thead>

            <tbody>
              {conditions.map((condition, index) => (
                <tr key={index}>
                  <td>{condition.type}</td>
                  <td>
                    <StatusBadge
                      status={condition.status === "True" ? "Ready" : "Warning"}
                    />
                  </td>
                  <td>{condition.reason}</td>
                  <td>{condition.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>🤖 AI Deployment Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <StatusBadge status={deployment.analysis?.severity || "Low"} />
        </p>

        <p>
          <strong>Root Cause:</strong>
          <br />
          {deployment.analysis?.root_cause || "No issues detected."}
        </p>

        <p>
          <strong>Recommendation:</strong>
          <br />
          {deployment.analysis?.recommendation || "No action required."}
        </p>

        <p>
          <strong>Owner:</strong>{" "}
          {deployment.analysis?.owner || "Platform Engineering"}
        </p>
      </div>
    </div>
  );
}

export default DeploymentDetails;