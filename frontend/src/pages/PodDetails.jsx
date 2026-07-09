import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPodAnalysis } from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

function PodDetails() {
  const { podName } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getPodAnalysis(podName);
        setData(result);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [podName]);

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
        <h1>📦 {data.pod.name}</h1>

        <p>
          <strong>Status:</strong>{" "}
          <StatusBadge status={data.pod.status} />
        </p>

        <p>
          <strong>Namespace:</strong> {data.pod.namespace}
        </p>
      </div>

      <div className="card">
        <h2>🤖 AI Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <span
            style={{
              background: severityColor[data.analysis.severity] || "#6b7280",
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
          <strong>Root Cause:</strong> {data.analysis.root_cause}
        </p>

        <p>
          <strong>Recommendation:</strong> {data.analysis.recommendation}
        </p>

        <p>
          <strong>Owner:</strong> {data.analysis.owner}
        </p>
      </div>

      <div className="card">
        <h2>📅 Kubernetes Events</h2>

        {data.events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          data.events.map((event, index) => (
            <div
              key={index}
              style={{
                borderBottom: "1px solid #333",
                padding: "12px 0",
              }}
            >
              <strong>
                {event.type} — {event.reason}
              </strong>

              <p>{event.message}</p>

              <small>{event.time}</small>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>📜 Container Logs</h2>

        <pre
          className="logs"
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          {data.logs?.logs ?? "No logs available"}
        </pre>
      </div>

    </div>
  );
}

export default PodDetails;