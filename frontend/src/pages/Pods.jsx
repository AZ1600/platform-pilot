import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPods } from "../services/api";

function Pods() {
  const [pods, setPods] = useState([]);
  const [error, setError] = useState(null);

  async function loadPods() {
    try {
      const data = await getPods();
      setPods(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadPods();

    const interval = setInterval(loadPods, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="container">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>📦 Pods</h2>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Pod</th>
              <th>Namespace</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {pods.map((pod) => (
              <tr key={pod.name}>
                <td>
                  <Link to={`/pods/${pod.name}`}>
                    {pod.name}
                  </Link>
                </td>

                <td>{pod.namespace}</td>

                <td>
                  <span
                    className={
                      pod.status === "Running"
                        ? "status-badge healthy"
                        : "status-badge warning"
                    }
                  >
                    {pod.status === "Running" ? "🟢" : "🟠"}{" "}
                    {pod.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pods;