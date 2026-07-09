import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getNamespaces } from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

function Namespaces() {
  const [namespaces, setNamespaces] = useState([]);
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

  return (
    <div className="container">
      <div className="card">
        <h1>📁 Namespaces</h1>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {namespaces.map((namespace) => (
              <tr key={namespace.name}>
                <td>
                  <Link to={`/namespaces/${namespace.name}`}>
                    {namespace.name}
                  </Link>
                </td>

                <td>
                  <StatusBadge status={namespace.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Namespaces;