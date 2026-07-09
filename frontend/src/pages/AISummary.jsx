import { useEffect, useState } from "react";

import { getClusterSummary } from "../services/api";

function AISummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getClusterSummary();
      setSummary(data);
    }

    load();
  }, []);

  if (!summary) {
    return (
      <div className="container">
        <h2>Loading AI Summary...</h2>
      </div>
    );
  }

  return (
    <div className="container">

      <div className="card">
        <h1>🧠 Cluster AI Summary</h1>

        <h2>
          Health Score: {summary.health_score}/100
        </h2>

        <h3>{summary.summary}</h3>
      </div>

      <div className="card">
        <h2>📦 Pods</h2>

        <p>
          <strong>Running:</strong> {summary.running_pods}
        </p>

        <p>
          <strong>Failed:</strong> {summary.failed_pods}
        </p>
      </div>

      <div className="card">
        <h2>🚀 Deployments</h2>

        <p>
          <strong>Healthy:</strong> {summary.healthy_deployments}
        </p>

        <p>
          <strong>Degraded:</strong> {summary.degraded_deployments}
        </p>
      </div>

      <div className="card">
        <h2>🤖 Recommendations</h2>

        <ul>
          {summary.recommendations.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default AISummary;