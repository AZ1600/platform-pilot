import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getDeployment } from "../services/api";

function DeploymentDetails() {
  const { deploymentName } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getDeployment(deploymentName);
        setData(result);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [deploymentName]);

  if (error) {
    return (
      <div className="container">
        <h2>{error}</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <h2>Loading...</h2>
      </div>
    );
  }

  const severityColor = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
  };

  return (
    <div className="container">

      <div className="card">
        <h1>🚀 {data.deployment.name}</h1>

        <p>
          <strong>Status:</strong> {data.status}
        </p>

        <p>
          <strong>Desired Replicas:</strong>{" "}
          {data.deployment.replicas}
        </p>

        <p>
          <strong>Ready Replicas:</strong>{" "}
          {data.deployment.ready}
        </p>

        <p>
          <strong>Available Replicas:</strong>{" "}
          {data.deployment.available}
        </p>
      </div>

      <div className="card">
        <h2>🤖 AI Deployment Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <span
            style={{
              background:
                severityColor[data.analysis.severity] || "#6b7280",
              color: "white",
              padding: "6px 14px",
              borderRadius: "20px",
              fontWeight: "bold",
            }}
          >
            {data.analysis.severity}
          </span>
        </p>

        <p>
          <strong>Root Cause:</strong>{" "}
          {data.analysis.root_cause}
        </p>

        <p>
          <strong>Recommendation:</strong>{" "}
          {data.analysis.recommendation}
        </p>

        <p>
          <strong>Owner:</strong>{" "}
          {data.analysis.owner}
        </p>
      </div>

    </div>
  );
}

export default DeploymentDetails;