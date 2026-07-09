import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPods } from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

function Pods() {
  const [pods, setPods] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await getPods();
        setPods(data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();

    const interval = setInterval(load, 10000);

    return () => clearInterval(interval);
  }, []);

  const statuses = ["All", ...new Set(pods.map((pod) => pod.status))];

  const filteredPods = pods.filter((pod) => {
    const matchesSearch =
      pod.name.toLowerCase().includes(search.toLowerCase()) ||
      pod.namespace.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || pod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>📦 Pods</h1>

        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search pods or namespaces..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <p className="result-count">
          Showing {filteredPods.length} of {pods.length} pods
        </p>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Pod</th>
              <th>Namespace</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredPods.map((pod) => (
              <tr key={pod.name}>
                <td>
                  <Link to={`/pods/${pod.name}`}>{pod.name}</Link>
                </td>

                <td>{pod.namespace}</td>

                <td>
                  <StatusBadge status={pod.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPods.length === 0 && (
          <p className="empty-state">No pods match your search.</p>
        )}
      </div>
    </div>
  );
}

export default Pods;