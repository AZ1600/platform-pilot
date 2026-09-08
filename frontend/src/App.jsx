import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";

import CommandPalette from "./components/CommandPalette";
import Navbar from "./components/Navbar";

const Dashboard = lazy(() =>
  import("./pages/Dashboard.jsx")
);
const Pods = lazy(() =>
  import("./pages/Pods.jsx")
);
const PodDetails = lazy(() =>
  import("./pages/PodDetails.jsx")
);
const Deployments = lazy(() =>
  import("./pages/Deployments.jsx")
);
const DeploymentDetails = lazy(() =>
  import("./pages/DeploymentDetails.jsx")
);
const Nodes = lazy(() =>
  import("./pages/Nodes.jsx")
);
const NodeDetails = lazy(() =>
  import("./pages/NodeDetails.jsx")
);
const Namespaces = lazy(() =>
  import("./pages/Namespaces.jsx")
);
const NamespaceDetails = lazy(() =>
  import("./pages/NamespaceDetails.jsx")
);
const AISummary = lazy(() =>
  import("./pages/AISummary.jsx")
);

function RouteFallback() {
  return (
    <div className="page">
      <div className="card">
        <p>Loading PlatformPilot...</p>
      </div>
    </div>
  );
}

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleShortcut(event) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, []);

  return (
    <BrowserRouter>
      <Navbar />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/pods" element={<Pods />} />
          <Route
            path="/pods/:namespace/:podName"
            element={<PodDetails />}
          />

          <Route
            path="/deployments"
            element={<Deployments />}
          />
          <Route
            path="/deployments/:deploymentName"
            element={<DeploymentDetails />}
          />

          <Route path="/nodes" element={<Nodes />} />
          <Route
            path="/nodes/:nodeName"
            element={<NodeDetails />}
          />

          <Route
            path="/namespaces"
            element={<Namespaces />}
          />
          <Route
            path="/namespaces/:namespaceName"
            element={<NamespaceDetails />}
          />

          <Route
            path="/ai-summary"
            element={<AISummary />}
          />
        </Routes>
      </Suspense>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </BrowserRouter>
  );
}

export default App;