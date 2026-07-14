import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

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
        item.state ||
        "Unknown",
      path: "/pods",
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
      path: "/deployments",
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
      path: "/nodes",
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
      path: "/namespaces",
    })),
  ].filter((item) => Boolean(item.name));
}

function GlobalSearch() {
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSearchData() {
      try {
        setLoading(true);

        const data = await getGlobalSearchData();

        setItems(normalizeItems(data));
      } catch (error) {
        console.error("Global search loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSearchData();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
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

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [items, query]);

  function handleChange(event) {
    const value = event.target.value;

    setQuery(value);
    setOpen(Boolean(value.trim()));
  }

  function clearSearch() {
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="global-search" ref={searchRef}>
      <div className="global-search-input-wrapper">
        <span className="global-search-icon">⌕</span>

        <input
          type="search"
          placeholder="Search cluster resources..."
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim()) {
              setOpen(true);
            }
          }}
          aria-label="Search cluster resources"
        />

        {query && (
          <button
            type="button"
            className="global-search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="global-search-results">
          {loading ? (
            <p className="global-search-message">
              Loading resources...
            </p>
          ) : results.length === 0 ? (
            <p className="global-search-message">
              No resources found.
            </p>
          ) : (
            results.map((item, index) => (
  <Link
    className="global-search-result"
    key={`${item.type}-${item.name}-${index}`}
    to={item.path}
    onClick={clearSearch}
  >
    <div className="global-search-result-content">
      <span className="global-search-result-icon">
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
  </Link>
))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;