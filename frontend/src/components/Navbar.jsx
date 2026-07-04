import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <h1>🚀 PlatformPilot</h1>

      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/pods">Pods</Link>
        <Link to="/deployments">Deployments</Link>
        <Link to="/nodes">Nodes</Link>
        <Link to="/namespaces">Namespaces</Link>
      </nav>
    </header>
  );
}

export default Navbar;