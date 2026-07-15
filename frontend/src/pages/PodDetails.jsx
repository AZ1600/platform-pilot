import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPodAnalysis, getPodLogs } from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

function PodDetails() {
  const { namespace, podName } = useParams();

  const [data, setData] = useState(null);
  const [liveLogs, setLiveLogs] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPodDetails() {
      try {
        setLoading(true);
        setError(null);

        const result = await getPodAnalysis(
          namespace,
          podName
        );

        if (result.error) {
          setError(result.error);
          return;
        }

        setData(result);
        setLiveLogs(result.logs?.logs || "");
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Pod details error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPodDetails();
  }, [namespace, podName]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const result = await getPodLogs(
          namespace,
          podName
        );

        if (result.error) {
          setLiveLogs(result.error);
        } else {
          setLiveLogs(
            result.logs || "No logs available."
          );
        }

        setLastUpdated(
          new Date().toLocaleTimeString()
        );
      } catch (err) {
        setLiveLogs(err.message);
      }
    }

    loadLogs();

    const interval = setInterval(
      loadLogs,
      5000
    );

    return () => clearInterval(interval);
  }, [namespace, podName]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading pod details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>Error: {error}</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const events = data.events || [];

  return (
    <div className="container">
      <div className="card">
        <h1>📦 {data.pod.name}</h1>

        <p>
          <strong>Status:</strong>{" "}
          <StatusBadge status={data.pod.status} />
        </p>

        <p>
          <strong>Namespace:</strong>{" "}
          {data.pod.namespace}
        </p>
      </div>

      <div className="card">
        <h2>🤖 AI Pod Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <StatusBadge
            status={
              data.analysis?.severity || "Unknown"
            }
          />
        </p>

        <p>
          <strong>Root Cause:</strong>
          <br />
          {data.analysis?.root_cause ||
            "No analysis available."}
        </p>

        <p>
          <strong>Recommendation:</strong>
          <br />
          {data.analysis?.recommendation ||
            "No recommendation available."}
        </p>

        <p>
          <strong>Owner:</strong>{" "}
          {data.analysis?.owner ||
            "Unassigned"}
        </p>
      </div>

      <div className="card">
        <h2>📅 Kubernetes Events</h2>

        {events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <table className="resource-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reason</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event, index) => (
                <tr key={index}>
                  <td>{event.type}</td>
                  <td>{event.reason}</td>
                  <td>{event.message}</td>
                  <td>{event.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>📜 Live Pod Logs</h2>

        <p
          style={{
            color: "#9ca3af",
            marginBottom: "12px",
          }}
        >
          Auto-refreshes every 5 seconds.
          <br />
          Last Updated: {lastUpdated}
        </p>

        <pre className="logs">
          {liveLogs}
        </pre>
      </div>
    </div>
  );
}

export default PodDetails;