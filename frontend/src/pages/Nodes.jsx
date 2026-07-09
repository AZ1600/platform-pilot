import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getNodes } from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

function Nodes() {
  const [nodes, setNodes] = useState([]);
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
        <h1>🖥️ Nodes</h1>

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
            {nodes.map((node) => (
              <tr key={node.name}>
                <td>
                  <Link to={`/nodes/${node.name}`}>
                    {node.name}
                  </Link>
                </td>

                <td>
                  <StatusBadge status={node.status} />
                </td>

                <td>{node.kubelet_version}</td>
                <td>{node.os}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Nodes;