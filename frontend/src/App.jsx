import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Pods from "./pages/Pods";
import Deployments from "./pages/Deployments";
import Nodes from "./pages/Nodes";
import Namespaces from "./pages/Namespaces";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pods" element={<Pods />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/namespaces" element={<Namespaces />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;