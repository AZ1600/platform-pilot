import { useEffect, useState } from "react";

import { getClusterSummary } from "../services/api";
import MetricCard from "../components/MetricCard";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const result = await getClusterSummary();
      setData(result);
    }

    load();
  }, []);

  if (!data) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>📊 Dashboard</h1>
        <p>Live Kubernetes cluster overview</p>
      </div>

      <div className="dashboard-grid">
        <MetricCard title="Health Score" value={`${data.health_score}/100`} />
        <MetricCard title="Running Pods" value={data.running_pods} />
        <MetricCard title="Healthy Deployments" value={data.healthy_deployments} />
        <MetricCard title="Failed Pods" value={data.failed_pods} />
      </div>

      <div className="card">
        <h2>🤖 AI Summary</h2>
        <p>{data.summary}</p>

        <h3>Recommendations</h3>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {data.recommendations.map((item, index) => (
            <li key={index}>✅ {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;