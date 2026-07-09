import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getNamespaces } from "../services/api";

function Namespaces() {
  const [namespaces, setNamespaces] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getNamespaces();
        setNamespaces(data);
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

  const filtered = namespaces.filter((namespace) => {
    const matchesSearch = namespace.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || namespace.status === filter;

    return matchesSearch && matchesFilter;
  });

  const statuses = ["All", ...new Set(namespaces.map((ns) => ns.status))];

  return (
    <div className="page">
      <div className="card">
        <h1>📁 Namespaces</h1>

        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search namespaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <p className="result-count">
          Showing {filtered.length} of {namespaces.length} namespaces
        </p>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((namespace) => (
              <tr key={namespace.name}>
                <td>
                  <Link to={`/namespaces/${namespace.name}`}>
                    {namespace.name}
                  </Link>
                </td>

                <td>
                  <span
                    className={
                      namespace.status === "Active"
                        ? "status-running"
                        : "status-failed"
                    }
                  >
                    {namespace.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="empty-state">No namespaces found.</p>
        )}
      </div>
    </div>
  );
}

export default Namespaces;