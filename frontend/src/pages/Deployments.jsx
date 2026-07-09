import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDeployments } from "../services/api";

function Deployments() {
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await getDeployments();
      setDeployments(data);
    }

    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 Deployments</h1>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Replicas</th>
              <th>Ready</th>
              <th>Available</th>
            </tr>
          </thead>

          <tbody>
            {deployments.map((deployment) => (
              <tr key={deployment.name}>
                <td>
                  <Link to={`/deployments/${deployment.name}`}>
                    {deployment.name}
                  </Link>
                </td>

                <td>{deployment.replicas}</td>
                <td>{deployment.ready}</td>
                <td>{deployment.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Deployments;