import EventTimeline from "./EventTimeline";

function IncidentCard({ incident }) {
  return (
    <div className="incident">

      <h2>{incident.name}</h2>

      <p><strong>Status:</strong> {incident.status}</p>

      <p><strong>Severity:</strong> {incident.severity}</p>

      <p><strong>Root Cause:</strong> {incident.root_cause}</p>

      <p><strong>Recommendation:</strong> {incident.recommendation}</p>

      <p><strong>Owner:</strong> {incident.owner}</p>

      <hr />

      <EventTimeline events={incident.events} />

      <hr />

      <h3>📄 Container Logs</h3>

      <pre className="logs">
        {incident.logs.logs
          ? incident.logs.logs
          : incident.logs.error}
      </pre>

    </div>
  );
}

export default IncidentCard;