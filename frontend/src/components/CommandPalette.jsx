import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { getGlobalSearchData } from "../services/api";


function normalizeItems(data = {}) {
  const pods = Array.isArray(data.pods) ? data.pods : [];
  const deployments = Array.isArray(data.deployments)
    ? data.deployments
    : [];
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const namespaces = Array.isArray(data.namespaces)
    ? data.namespaces
    : [];

  return [
    ...pods.map((item) => ({
      type: "Pod",
      icon: "🟢",
      name:
        item.name ||
        item.pod_name ||
        item.metadata?.name,
      namespace:
        item.namespace ||
        item.metadata?.namespace,
      status:
        item.status ||
        item.phase ||
        "Unknown",
      path: `/pods/${item.namespace}/${item.name}`,
    })),

    ...deployments.map((item) => ({
      type: "Deployment",
      icon: "📦",
      name:
        item.name ||
        item.deployment_name ||
        item.metadata?.name,
      namespace:
        item.namespace ||
        item.metadata?.namespace,
      status:
        item.status ||
        (item.ready === item.replicas
          ? "Available"
          : "Degraded"),
      path: `/deployments/${item.name}`,
    })),

    ...nodes.map((item) => ({
      type: "Node",
      icon: "🖥️",
      name:
        item.name ||
        item.node ||
        item.node_name ||
        item.metadata?.name,
      namespace: null,
      status:
        item.status ||
        (item.ready ? "Ready" : "Not Ready"),
      path: `/nodes/${item.name || item.node}`,
    })),

    ...namespaces.map((item) => ({
      type: "Namespace",
      icon: "📁",
      name:
        item.name ||
        item.namespace ||
        item.metadata?.name,
      namespace: null,
      status: item.status || "Active",
      path: `/namespaces/${item.name || item.namespace}`,
    })),
  ].filter((item) => Boolean(item.name));
}


function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);


  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadSearchData() {
      try {
        setLoading(true);

        const data = await getGlobalSearchData();

        setItems(normalizeItems(data));
      } catch (error) {
        console.error(
          "Command palette loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSearchData();
  }, [open]);


  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);


  const results = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return items.slice(0, 8);
    }

    return items
      .filter((item) => {
        const searchableText = [
          item.name,
          item.type,
          item.namespace,
          item.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedQuery
        );
      })
      .slice(0, 10);
  }, [items, query]);


  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);


  function openResult(item) {
    if (!item) {
      return;
    }

    navigate(item.path);
    onClose();
  }


  useEffect(() => {
    function handleKeyboard(event) {
      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setSelectedIndex((current) =>
          Math.min(
            current + 1,
            Math.max(results.length - 1, 0)
          )
        );

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setSelectedIndex((current) =>
          Math.max(current - 1, 0)
        );

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        openResult(results[selectedIndex]);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    open,
    onClose,
    results,
    selectedIndex,
  ]);


  if (!open) {
    return null;
  }


  return (
    <div
      className="command-overlay"
      onClick={onClose}
    >
      <div
        className="command-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="command-header">
          <div>
            <h2>🔍 Search PlatformPilot</h2>
            <p>
              Search Pods, Deployments, Nodes,
              and Namespaces
            </p>
          </div>

          <span className="command-shortcut">
            ESC
          </span>
        </div>

        <input
          autoFocus
          placeholder="Search cluster resources..."
          className="command-input"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <div className="command-results">
          {loading ? (
            <p className="command-message">
              Loading cluster resources...
            </p>
          ) : results.length === 0 ? (
            <p className="command-message">
              No resources found.
            </p>
          ) : (
            results.map((item, index) => (
              <button
                type="button"
                className={`command-result ${
                  index === selectedIndex
                    ? "selected"
                    : ""
                }`}
                key={`${item.type}-${item.name}-${index}`}
                onMouseEnter={() =>
                  setSelectedIndex(index)
                }
                onClick={() =>
                  openResult(item)
                }
              >
                <div className="command-result-main">
                  <span className="command-result-icon">
                    {item.icon}
                  </span>

                  <div>
                    <strong>{item.name}</strong>

                    <p>
                      {item.type}
                      {item.namespace
                        ? ` · ${item.namespace}`
                        : ""}
                    </p>
                  </div>
                </div>

                <span
                  className={`search-result-status ${
                    item.status
                      ?.toLowerCase()
                      .replaceAll(" ", "-") || ""
                  }`}
                >
                  {item.status || "Unknown"}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="command-footer">
          <span>↑ ↓ Navigate</span>
          <span>Enter Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}


export default CommandPalette;