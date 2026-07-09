import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard.jsx";
import Pods from "./pages/Pods.jsx";
import PodDetails from "./pages/PodDetails.jsx";
import Deployments from "./pages/Deployments.jsx";
import DeploymentDetails from "./pages/DeploymentDetails.jsx";
import Nodes from "./pages/Nodes.jsx";
import NodeDetails from "./pages/NodeDetails.jsx";
import Namespaces from "./pages/Namespaces.jsx";
import AISummary from "./pages/AISummary.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/pods" element={<Pods />} />
        <Route path="/pods/:podName" element={<PodDetails />} />

        <Route path="/deployments" element={<Deployments />} />
        <Route
          path="/deployments/:deploymentName"
          element={<DeploymentDetails />}
        />

        <Route path="/nodes" element={<Nodes />} />
        <Route path="/nodes/:nodeName" element={<NodeDetails />} />

        <Route path="/namespaces" element={<Namespaces />} />
        <Route path="/ai-summary" element={<AISummary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;