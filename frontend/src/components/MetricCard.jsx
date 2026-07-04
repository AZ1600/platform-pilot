function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}

export default MetricCard;