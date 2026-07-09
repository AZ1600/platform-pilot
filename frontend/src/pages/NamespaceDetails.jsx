import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getNamespace } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge.jsx";

function NamespaceDetails() {
  const { namespaceName } = useParams();

  const [namespace, setNamespace] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getNamespace(namespaceName);
        setNamespace(data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [namespaceName]);

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  if (!namespace) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading namespace...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>📁 {namespace.name}</h1>

        <p>
          <strong>Status:</strong>{" "}
          <StatusBadge status={namespace.status} />
        </p>
      </div>

      <div className="dashboard-grid">
        <MetricCard title="Pods" value={namespace.pods} />
        <MetricCard title="Deployments" value={namespace.deployments} />
        <MetricCard title="Services" value={namespace.services} />
        <MetricCard title="ConfigMaps" value={namespace.configmaps} />
        <MetricCard title="Secrets" value={namespace.secrets} />
        <MetricCard title="Unhealthy Pods" value={namespace.unhealthy_pods} />
      </div>

      <div className="card">
        <h2>🤖 AI Namespace Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <StatusBadge status={namespace.analysis.severity} />
        </p>

        <p>
          <strong>Root Cause:</strong>
          <br />
          {namespace.analysis.root_cause}
        </p>

        <p>
          <strong>Recommendation:</strong>
          <br />
          {namespace.analysis.recommendation}
        </p>

        <p>
          <strong>Owner:</strong> {namespace.analysis.owner}
        </p>
      </div>
    </div>
  );
}

export default NamespaceDetails;