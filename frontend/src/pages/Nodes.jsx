import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getNodes } from "../services/api";

function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getNodes();
        setNodes(data);
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

  const filtered = nodes.filter((node) => {
    const matchesSearch = node.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      (filter === "Ready" && node.status === "Ready") ||
      (filter === "Not Ready" && node.status !== "Ready");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page">
      <div className="card">
        <h1>🖥️ Nodes</h1>

        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Ready</option>
            <option>Not Ready</option>
          </select>
        </div>

        <p className="result-count">
          Showing {filtered.length} of {nodes.length} nodes
        </p>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Kubelet Version</th>
              <th>OS</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((node) => (
              <tr key={node.name}>
                <td>
                  <Link to={`/nodes/${node.name}`}>{node.name}</Link>
                </td>

                <td>
                  <span
                    className={
                      node.status === "Ready"
                        ? "status-running"
                        : "status-failed"
                    }
                  >
                    {node.status}
                  </span>
                </td>

                <td>{node.kubelet_version}</td>
                <td>{node.os}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="empty-state">No nodes found.</p>
        )}
      </div>
    </div>
  );
}

export default Nodes;