import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDeployments } from "../services/api";

function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeployments();
        setDeployments(data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();

    const interval = setInterval(load, 10000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  const filtered = deployments.filter((deployment) => {
    const healthy =
      deployment.ready === deployment.available &&
      deployment.ready === deployment.replicas;

    const matchesSearch =
      deployment.name.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      (filter === "Healthy" && healthy) ||
      (filter === "Degraded" && !healthy);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page">
      <div className="card">

        <h1>🚀 Deployments</h1>

        <div className="toolbar">

          <input
            className="search-input"
            placeholder="Search deployments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Healthy</option>
            <option>Degraded</option>
          </select>

        </div>

        <p className="result-count">
          Showing {filtered.length} of {deployments.length} deployments
        </p>

        <table className="resource-table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Replicas</th>
              <th>Ready</th>
              <th>Available</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {filtered.map((deployment) => {
              const healthy =
                deployment.ready === deployment.available &&
                deployment.ready === deployment.replicas;

              return (
                <tr key={deployment.name}>
                  <td>
                    <Link to={`/deployments/${deployment.name}`}>
                      {deployment.name}
                    </Link>
                  </td>

                  <td>{deployment.replicas}</td>

                  <td>{deployment.ready}</td>

                  <td>{deployment.available}</td>

                  <td>
                    <span
                      className={
                        healthy ? "status-running" : "status-failed"
                      }
                    >
                      {healthy ? "Healthy" : "Degraded"}
                    </span>
                  </td>
                </tr>
              );
            })}

          </tbody>

        </table>

        {filtered.length === 0 && (
          <p className="empty-state">
            No deployments found.
          </p>
        )}

      </div>
    </div>
  );
}

export default Deployments;