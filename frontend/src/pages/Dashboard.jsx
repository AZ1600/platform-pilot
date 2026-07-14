import { useCallback, useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAiSummary,
  getClusterSummary,
  getPrometheusClusterMetrics,
  getPrometheusNamespaceMetrics,
} from "../services/api";


const HISTORY_LIMIT = 20;


function calculateAverage(items, propertyName) {
  if (!items?.length) {
    return 0;
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item[propertyName] || 0),
    0
  );

  return Number((total / items.length).toFixed(2));
}


function getPrometheusStatus(prometheus) {
  if (!prometheus?.reachable) {
    return {
      label: "Offline",
      className: "offline",
    };
  }

  if (prometheus.status === "healthy") {
    return {
      label: "Connected",
      className: "healthy",
    };
  }

  return {
    label: "Partial",
    className: "degraded",
  };
}


function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [namespaceMetrics, setNamespaceMetrics] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);


  const loadDashboard = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      }

      setError(null);

      const [
        clusterData,
        metricsData,
        namespaceData,
        aiData,
      ] = await Promise.all([
        getClusterSummary(),
        getPrometheusClusterMetrics(),
        getPrometheusNamespaceMetrics(),
        getAiSummary(),
      ]);

      const averageCpu = calculateAverage(
        metricsData.cpu,
        "cpu_usage_percent"
      );

      const averageMemory = calculateAverage(
        metricsData.memory,
        "memory_usage_percent"
      );

      const now = new Date();

      setSummary(clusterData);
      setMetrics(metricsData);
      setNamespaceMetrics(namespaceData.namespaces || []);
      setAiSummary(aiData);
      setLastUpdated(now);

      setHistory((currentHistory) => {
        const nextHistory = [
          ...currentHistory,
          {
            time: now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            cpu: averageCpu,
            memory: averageMemory,
          },
        ];

        return nextHistory.slice(-HISTORY_LIMIT);
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.message ||
          "PlatformPilot could not load observability data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  const exportDashboardReport = async () => {
  const dashboardElement = document.getElementById(
    "platformpilot-dashboard-report"
  );

  if (!dashboardElement) {
    setError("PlatformPilot could not find the dashboard report.");
    return;
  }

  try {
    setExporting(true);
    setError(null);

    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#0f111a",
      logging: false,
      windowWidth: dashboardElement.scrollWidth,
      windowHeight: dashboardElement.scrollHeight,
    });

    const imageData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const imageHeight =
      (canvas.height * availableWidth) / canvas.width;

    let remainingHeight = imageHeight;
    let imagePosition = margin;

    pdf.setFillColor(15, 17, 26);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.addImage(
      imageData,
      "PNG",
      margin,
      imagePosition,
      availableWidth,
      imageHeight
    );

    remainingHeight -= availableHeight;

    while (remainingHeight > 0) {
      pdf.addPage();

      pdf.setFillColor(15, 17, 26);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      imagePosition =
        margin - (imageHeight - remainingHeight);

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        imagePosition,
        availableWidth,
        imageHeight
      );

      remainingHeight -= availableHeight;
    }

    const timestamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    pdf.save(
      `platformpilot-cluster-report-${timestamp}.pdf`
    );
  } catch (err) {
    console.error("PDF export error:", err);

    setError(
      "PlatformPilot could not export the dashboard report."
    );
  } finally {
    setExporting(false);
  }
};


  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadDashboard]);


  const averageCpu = useMemo(
    () =>
      calculateAverage(
        metrics?.cpu,
        "cpu_usage_percent"
      ),
    [metrics]
  );

  const averageMemory = useMemo(
    () =>
      calculateAverage(
        metrics?.memory,
        "memory_usage_percent"
      ),
    [metrics]
  );


  const podChartData = useMemo(
    () => [
      {
        name: "Running",
        value: metrics?.pods?.running || 0,
      },
      {
        name: "Pending",
        value: metrics?.pods?.pending || 0,
      },
      {
        name: "Failed",
        value: metrics?.pods?.failed || 0,
      },
      {
        name: "Succeeded",
        value: metrics?.pods?.succeeded || 0,
      },
      {
        name: "Unknown",
        value: metrics?.pods?.unknown || 0,
      },
    ].filter((item) => item.value > 0),
    [metrics]
  );


  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="loading-spinner" />

          <h2>Loading PlatformPilot...</h2>

          <p>
            Reading Kubernetes resources and Prometheus metrics.
          </p>
        </div>
      </div>
    );
  }


  if (!summary) {
    return (
      <div className="page">
        <div className="card error-card">
          <h2>Dashboard unavailable</h2>

          <p>
            {error ||
              "PlatformPilot could not load cluster information."}
          </p>

          <button
            className="refresh-button"
            type="button"
            onClick={() => loadDashboard(true)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  const prometheusStatus = getPrometheusStatus(
    metrics?.prometheus
  );

  const runningPods =
    metrics?.pods?.running ?? summary.pods.running;

  const pendingPods =
    metrics?.pods?.pending ?? 0;

  const failedPods =
    metrics?.pods?.failed ?? summary.pods.failed;

  const totalPods =
    metrics?.pods?.total ?? summary.pods.total;


  return (
  <div
    className="page"
    id="platformpilot-dashboard-report"
  >
    <section className="hero-card dashboard-hero">
        <div>
          <h1>📊 Dashboard</h1>

          <p>
            Live Kubernetes and Prometheus cluster overview
          </p>
        </div>

        <div className="dashboard-actions">

  <div className="dashboard-action-buttons">

    <button
      className="export-button"
      type="button"
      disabled={exporting}
      onClick={exportDashboardReport}
    >
      {exporting ? "Exporting..." : "Export PDF"}
    </button>

    <button
      className="refresh-button"
      type="button"
      disabled={refreshing}
      onClick={() => loadDashboard(true)}
    >
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>

  </div>

  {lastUpdated && (
    <small>
      Updated {lastUpdated.toLocaleTimeString()}
    </small>
  )}

</div>
      </section>


      {error && (
        <div className="dashboard-warning">
          <strong>Monitoring warning:</strong> {error}
        </div>
      )}


      <div className="section-heading">
        <div>
          <h2>☸️ Kubernetes Overview</h2>
          <p>Current cluster resources and health.</p>
        </div>
      </div>


      <div className="stats-grid">
        <div className="stat-card">
          <h3>Health Score</h3>
          <h2>{summary.health_score}/100</h2>
          <p>{summary.summary}</p>
        </div>

        <div className="stat-card">
          <h3>Pods</h3>
          <h2>{summary.pods.total}</h2>
          <p>{summary.pods.running} Running</p>
        </div>

        <div className="stat-card">
          <h3>Deployments</h3>
          <h2>{summary.deployments.total}</h2>
          <p>{summary.deployments.healthy} Healthy</p>
        </div>

        <div className="stat-card">
          <h3>Nodes</h3>
          <h2>{summary.nodes.total}</h2>
          <p>{summary.nodes.ready} Ready</p>
        </div>

        <div className="stat-card">
          <h3>Namespaces</h3>
          <h2>{summary.namespaces.total}</h2>
          <p>{summary.namespaces.active} Active</p>
        </div>

        <div className="stat-card">
          <h3>Incidents</h3>
          <h2>{summary.incidents.length}</h2>
          <p>
            {summary.incidents.length === 0
              ? "No active incidents"
              : "Requires attention"}
          </p>
        </div>
      </div>


      <div className="section-heading">
        <div>
          <h2>🔥 Prometheus Observability</h2>
          <p>Live performance and monitoring information.</p>
        </div>

        <span
          className={`monitoring-status ${prometheusStatus.className}`}
        >
          ● Prometheus {prometheusStatus.label}
        </span>
      </div>


      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">⚡</span>
          <div>
            <h3>Cluster CPU</h3>
            <h2>{averageCpu}%</h2>
            <p>Average node usage</p>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">💾</span>
          <div>
            <h3>Cluster Memory</h3>
            <h2>{averageMemory}%</h2>
            <p>Average node usage</p>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🟢</span>
          <div>
            <h3>Running Pods</h3>
            <h2>{runningPods}</h2>
            <p>Out of {totalPods} Pods</p>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🟡</span>
          <div>
            <h3>Pending Pods</h3>
            <h2>{pendingPods}</h2>
            <p>Waiting for scheduling</p>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🔴</span>
          <div>
            <h3>Failed Pods</h3>
            <h2>{failedPods}</h2>
            <p>Requires investigation</p>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🎯</span>
          <div>
            <h3>Prometheus Targets</h3>
            <h2>
              {metrics?.prometheus?.healthy_targets ?? 0}/
              {metrics?.prometheus?.total_targets ?? 0}
            </h2>
            <p>Healthy scrape targets</p>
          </div>
        </div>
      </div>


      <div className="charts-grid">
        <article className="card chart-card">
          <div className="chart-heading">
            <div>
              <h2>📈 CPU and Memory Trend</h2>
              <p>Collected every ten seconds.</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#283149"
                />

                <XAxis
                  dataKey="time"
                  stroke="#8f99ad"
                  minTickGap={30}
                />

                <YAxis
                  stroke="#8f99ad"
                  domain={[0, 100]}
                  unit="%"
                />

                <Tooltip />
                <Legend />

                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3979ff"
                  fill="#3979ff"
                  fillOpacity={0.2}
                />

                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>


        <article className="card chart-card">
          <div className="chart-heading">
            <div>
              <h2>📦 Pod Status</h2>
              <p>Current Kubernetes Pod phases.</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={podChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  label
                >
                  {podChartData.map((entry) => {
                    const colors = {
                      Running: "#22c55e",
                      Pending: "#f59e0b",
                      Failed: "#ef4444",
                      Succeeded: "#3979ff",
                      Unknown: "#94a3b8",
                    };

                    return (
                      <Cell
                        key={entry.name}
                        fill={colors[entry.name]}
                      />
                    );
                  })}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>


      <article className="card chart-card">
        <div className="chart-heading">
          <div>
            <h2>🗂️ Running Pods by Namespace</h2>
            <p>
              Workload distribution across the cluster.
            </p>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={namespaceMetrics}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#283149"
              />

              <XAxis
                dataKey="namespace"
                stroke="#8f99ad"
              />

              <YAxis
                allowDecimals={false}
                stroke="#8f99ad"
              />

              <Tooltip />

              <Bar
                dataKey="running_pods"
                name="Running Pods"
                fill="#3979ff"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>


           <div className="bottom-grid">
        <article className="card node-summary-card">
  <div className="node-summary-header">
    <div>
      <h2>🖥️ Node Observability</h2>
      <p>Live health and resource usage for cluster nodes.</p>
    </div>

    <span
      className={
        metrics?.nodes?.items?.every((node) => node.ready)
          ? "monitoring-status healthy"
          : "monitoring-status degraded"
      }
    >
      ●{" "}
      {metrics?.nodes?.items?.every((node) => node.ready)
        ? "All Nodes Ready"
        : "Node Attention Required"}
    </span>
  </div>

  {!metrics?.nodes?.items?.length ? (
    <p>No Prometheus node information available.</p>
  ) : (
    <div className="node-summary-list">
      {metrics.nodes.items.map((node) => (
        <div
          className="node-summary-item"
          key={node.node}
        >
          <div className="node-summary-identity">
            <div>
              <h3>{node.node}</h3>
              <p>Kubernetes worker/control-plane node</p>
            </div>

            <span
              className={
                node.ready
                  ? "monitoring-status healthy"
                  : "monitoring-status degraded"
              }
            >
              ● {node.status}
            </span>
          </div>

          <div className="node-kpi-grid">
            <div className="node-kpi">
              <span>CPU Usage</span>
              <strong>{averageCpu}%</strong>
            </div>

            <div className="node-kpi">
              <span>Memory Usage</span>
              <strong>{averageMemory}%</strong>
            </div>

            <div className="node-kpi">
              <span>Running Pods</span>
              <strong>{runningPods}</strong>
            </div>

            <div className="node-kpi">
              <span>Prometheus</span>
              <strong>
                {metrics?.prometheus?.healthy_targets ?? 0}/
                {metrics?.prometheus?.total_targets ?? 0}
              </strong>
            </div>
          </div>

          <div className="node-progress-section">
            <div className="node-progress-block">
              <div className="node-progress-heading">
                <span>CPU</span>
                <strong>{averageCpu}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill cpu-progress"
                  style={{
                    width: `${Math.min(averageCpu, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="node-progress-block">
              <div className="node-progress-heading">
                <span>Memory</span>
                <strong>{averageMemory}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill memory-progress"
                  style={{
                    width: `${Math.min(
                      averageMemory,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</article>

        {aiSummary ? (
          <article className="card ai-insights-card">
            <div className="ai-insights-header">
              <div>
                <h2>🤖 AI Operations Summary</h2>

                <p>
                  {aiSummary.summary ||
                    "PlatformPilot is analysing the cluster."}
                </p>
              </div>

              <div
                className={`ai-health-score ${
                  aiSummary.status || "unknown"
                }`}
              >
                <span>Health Score</span>

                <strong>
                  {aiSummary.health_score ?? 0}/100
                </strong>
              </div>
            </div>

            <div className="ai-insights-grid">
              <section>
                <h3>Findings</h3>

                <ul className="insight-list">
                  {(aiSummary.findings || []).map(
                    (item, index) => (
                      <li key={`${item}-${index}`}>
                        <span>●</span>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </section>

              <section>
                <h3>Recommendations</h3>

                <ul className="insight-list recommendations-list">
                  {(aiSummary.recommendations || []).map(
                    (item, index) => (
                      <li key={`${item}-${index}`}>
                        <span>→</span>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </section>
            </div>

            <div className="score-breakdown">
              <h3>Score Breakdown</h3>

              {(aiSummary.score_breakdown || []).map(
                (item) => (
                  <div
                    className="score-breakdown-row"
                    key={item.category}
                  >
                    <div>
                      <strong>{item.category}</strong>
                      <p>{item.reason}</p>
                    </div>

                    <span
                      className={
                        item.change < 0
                          ? "score-negative"
                          : "score-neutral"
                      }
                    >
                      {item.change > 0 ? "+" : ""}
                      {item.change}
                    </span>
                  </div>
                )
              )}
            </div>

            {(aiSummary.incidents || []).length > 0 && (
              <div className="ai-incidents">
                <h3>Detected Incidents</h3>

                {aiSummary.incidents.map(
                  (incident, index) => (
                    <div
                      className={`ai-incident ${
                        incident.severity
                      }`}
                      key={`${incident.title}-${index}`}
                    >
                      <div>
                        <strong>{incident.title}</strong>
                        <p>{incident.message}</p>
                      </div>

                      <span>{incident.severity}</span>
                    </div>
                  )
                )}
              </div>
            )}
          </article>
        ) : (
          <article className="card ai-insights-card">
            <h2>🤖 AI Operations Summary</h2>
            <p>Loading AI cluster analysis...</p>
          </article>
        )}
      </div>



      <article className="card">
        <h2>🚨 Active Incidents</h2>

        {summary.incidents.length === 0 ? (
          <p>🎉 No active incidents detected.</p>
        ) : (
          <div className="table-wrapper">
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Namespace</th>
                  <th>Status</th>
                  <th>Severity</th>
                </tr>
              </thead>

              <tbody>
                {summary.incidents.map((incident, index) => (
                  <tr key={`${incident.name}-${index}`}>
                    <td>{incident.type}</td>
                    <td>{incident.name}</td>
                    <td>{incident.namespace}</td>
                    <td>{incident.status}</td>
                    <td>{incident.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}


export default Dashboard;