import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

import Navbar from "../components/Navbar";
import MetricCard from "../components/MetricCard";
import IncidentCard from "../components/IncidentCard";

import "../App.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  async function loadDashboard() {
    try {
      const data = await getDashboard();
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
      <>
        <Navbar />
        <div className="container">
          <h2>{error}</h2>
        </div>
      </>
    );
  }

  if (!dashboard) {
    return (
      <>
        <Navbar />
        <div className="container">
          <h2>Loading PlatformPilot...</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container">

        <div className="card">
          <h2>
            Cluster Status{" "}
            {dashboard.cluster_status === "Healthy"
              ? "🟢 Healthy"
              : "🟠 Warning"}
          </h2>
        </div>

        <div className="metrics">
          <MetricCard title="Pods" value={dashboard.pods} />
          <MetricCard title="Deployments" value={dashboard.deployments} />
          <MetricCard title="Risks" value={dashboard.active_risks} />
        </div>

        <div className="card">
          <h2>🚨 Active Incidents</h2>

          {dashboard.incidents.length === 0 ? (
            <p>✅ No active incidents</p>
          ) : (
            dashboard.incidents.map((incident, index) => (
              <IncidentCard
                key={index}
                incident={incident}
              />
            ))
          )}
        </div>

      </div>
    </>
  );
}

export default Dashboard;