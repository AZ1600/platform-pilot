import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./App.css";

import CommandPalette from "./components/CommandPalette";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard.jsx";
import Pods from "./pages/Pods.jsx";
import PodDetails from "./pages/PodDetails.jsx";
import Deployments from "./pages/Deployments.jsx";
import DeploymentDetails from "./pages/DeploymentDetails.jsx";
import Nodes from "./pages/Nodes.jsx";
import NodeDetails from "./pages/NodeDetails.jsx";
import Namespaces from "./pages/Namespaces.jsx";
import NamespaceDetails from "./pages/NamespaceDetails.jsx";
import AISummary from "./pages/AISummary.jsx";


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

      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/pods" element={<Pods />} />
        <Route
          path="/pods/:podName"
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

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </BrowserRouter>
  );
}


export default App;