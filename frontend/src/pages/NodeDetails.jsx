import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

function NodeDetails() {
  const { nodeName } = useParams();

  const [node, setNode] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/nodes/${nodeName}`)
      .then((r) => r.json())
      .then(setNode);
  }, [nodeName]);

  if (!node) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">

      <div className="card">
        <h1>🖥️ {node.name}</h1>

        <table className="resource-table">
          <tbody>

            <tr>
              <td><strong>Status</strong></td>
              <td>
                <StatusBadge status={node.status} />
              </td>
            </tr>

            <tr>
              <td><strong>Kubernetes Version</strong></td>
              <td>{node.kubelet_version}</td>
            </tr>

            <tr>
              <td><strong>Operating System</strong></td>
              <td>{node.os}</td>
            </tr>

            <tr>
              <td><strong>Architecture</strong></td>
              <td>{node.architecture}</td>
            </tr>

            <tr>
              <td><strong>Kernel</strong></td>
              <td>{node.kernel_version}</td>
            </tr>

            <tr>
              <td><strong>Container Runtime</strong></td>
              <td>{node.container_runtime}</td>
            </tr>

            <tr>
              <td><strong>CPU Capacity</strong></td>
              <td>{node.capacity.cpu}</td>
            </tr>

            <tr>
              <td><strong>Memory</strong></td>
              <td>{node.capacity.memory}</td>
            </tr>

            <tr>
              <td><strong>Pod Capacity</strong></td>
              <td>{node.capacity.pods}</td>
            </tr>

          </tbody>
        </table>
      </div>

      <div className="card">

        <h2>🤖 AI Node Analysis</h2>

        <p>
          <strong>Severity:</strong>{" "}
          <StatusBadge status={node.analysis.severity} />
        </p>

        <p>
          <strong>Root Cause:</strong><br />
          {node.analysis.root_cause}
        </p>

        <p>
          <strong>Recommendation:</strong><br />
          {node.analysis.recommendation}
        </p>

        <p>
          <strong>Owner:</strong> {node.analysis.owner}
        </p>

      </div>

    </div>
  );
}

export default NodeDetails;