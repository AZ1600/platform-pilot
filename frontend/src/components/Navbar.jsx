import { Link } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <h1>🚀 PlatformPilot</h1>

        <GlobalSearch />

        <nav className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/pods">Pods</Link>
          <Link to="/deployments">Deployments</Link>
          <Link to="/nodes">Nodes</Link>
          <Link to="/namespaces">Namespaces</Link>
          <Link to="/ai-summary">AI Summary</Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;