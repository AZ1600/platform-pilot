from typing import Any

from kubernetes_client import (
    list_all_pods,
    list_nodes,
)

from services.prometheus_service import (
    get_node_cpu_usage,
    get_node_memory_usage,
    get_prometheus_health,
)


def calculate_average(
    items: list[dict[str, Any]],
    field_name: str,
) -> float:
    """
    Calculate the average value for a numeric field.
    """

    if not items:
        return 0.0

    values = [
        float(item.get(field_name, 0))
        for item in items
    ]

    return round(sum(values) / len(values), 2)


def generate_cluster_summary() -> dict[str, Any]:
    """
    Analyse Kubernetes and Prometheus data and return
    findings, recommendations, incidents, and a health score.
    """

    pods = list_all_pods()
    nodes = list_nodes()

    cpu_metrics = get_node_cpu_usage()
    memory_metrics = get_node_memory_usage()
    prometheus = get_prometheus_health()

    cpu = calculate_average(
        cpu_metrics,
        "cpu_usage_percent",
    )

    memory = calculate_average(
        memory_metrics,
        "memory_usage_percent",
    )

    findings: list[str] = []
    recommendations: list[str] = []
    incidents: list[dict[str, Any]] = []
    score_breakdown: list[dict[str, Any]] = []

    health = 100

    # CPU analysis
    if cpu > 80:
        health -= 15

        findings.append(
            f"Cluster CPU usage is high at {cpu}%."
        )

        recommendations.append(
            "Investigate CPU-intensive workloads and consider scaling."
        )

        incidents.append(
            {
                "severity": "high",
                "source": "Prometheus",
                "title": "High CPU usage",
                "message": f"Average cluster CPU usage is {cpu}%.",
            }
        )

        score_breakdown.append(
            {
                "category": "CPU",
                "change": -15,
                "reason": "CPU usage is above 80%.",
            }
        )
    else:
        findings.append(
            f"CPU utilization is healthy at {cpu}%."
        )

        score_breakdown.append(
            {
                "category": "CPU",
                "change": 0,
                "reason": "CPU usage is within the healthy range.",
            }
        )

    # Memory analysis
    if memory > 80:
        health -= 15

        findings.append(
            f"Cluster memory usage is high at {memory}%."
        )

        recommendations.append(
            "Inspect memory-heavy workloads and review resource limits."
        )

        incidents.append(
            {
                "severity": "high",
                "source": "Prometheus",
                "title": "High memory usage",
                "message": f"Average cluster memory usage is {memory}%.",
            }
        )

        score_breakdown.append(
            {
                "category": "Memory",
                "change": -15,
                "reason": "Memory usage is above 80%.",
            }
        )
    else:
        findings.append(
            f"Memory utilization is healthy at {memory}%."
        )

        score_breakdown.append(
            {
                "category": "Memory",
                "change": 0,
                "reason": "Memory usage is within the healthy range.",
            }
        )

    # Pod analysis
    unhealthy_pods = [
        pod
        for pod in pods
        if pod["status"] not in {"Running", "Succeeded"}
    ]

    if unhealthy_pods:
        deduction = min(len(unhealthy_pods) * 10, 30)
        health -= deduction

        findings.append(
            f"{len(unhealthy_pods)} Pod(s) are unhealthy."
        )

        recommendations.append(
            "Inspect non-running Pods using kubectl describe and kubectl logs."
        )

        for pod in unhealthy_pods:
            incidents.append(
                {
                    "severity": "high",
                    "source": "Kubernetes",
                    "title": "Unhealthy Pod",
                    "resource": pod["name"],
                    "namespace": pod["namespace"],
                    "message": (
                        f"Pod {pod['name']} is currently "
                        f"{pod['status']}."
                    ),
                }
            )

        score_breakdown.append(
            {
                "category": "Pods",
                "change": -deduction,
                "reason": (
                    f"{len(unhealthy_pods)} unhealthy Pod(s) detected."
                ),
            }
        )
    else:
        findings.append(
            "All Pods are running or completed successfully."
        )

        score_breakdown.append(
            {
                "category": "Pods",
                "change": 0,
                "reason": "No unhealthy Pods detected.",
            }
        )

    # Node analysis
    unhealthy_nodes = [
        node
        for node in nodes
        if node["status"] != "Ready"
    ]

    if unhealthy_nodes:
        health -= 20

        findings.append(
            f"{len(unhealthy_nodes)} Kubernetes node(s) are unhealthy."
        )

        recommendations.append(
            "Inspect node conditions, pressure states, and kubelet logs."
        )

        for node in unhealthy_nodes:
            incidents.append(
                {
                    "severity": "critical",
                    "source": "Kubernetes",
                    "title": "Node not ready",
                    "resource": node["name"],
                    "message": (
                        f"Node {node['name']} is {node['status']}."
                    ),
                }
            )

        score_breakdown.append(
            {
                "category": "Nodes",
                "change": -20,
                "reason": "One or more nodes are not Ready.",
            }
        )
    else:
        findings.append(
            "All Kubernetes nodes are Ready."
        )

        score_breakdown.append(
            {
                "category": "Nodes",
                "change": 0,
                "reason": "All nodes are Ready.",
            }
        )

    # Prometheus analysis
    healthy_targets = prometheus["healthy_targets"]
    total_targets = prometheus["total_targets"]
    unhealthy_targets = prometheus["unhealthy_targets"]

    if unhealthy_targets > 0:
        health -= 10

        findings.append(
            f"{healthy_targets}/{total_targets} Prometheus targets are healthy."
        )

        recommendations.append(
            "Inspect unavailable Prometheus scrape targets."
        )

        incidents.append(
            {
                "severity": "warning",
                "source": "Prometheus",
                "title": "Prometheus targets unavailable",
                "message": (
                    f"{unhealthy_targets} scrape target(s) are unavailable."
                ),
            }
        )

        score_breakdown.append(
            {
                "category": "Prometheus",
                "change": -10,
                "reason": (
                    f"{unhealthy_targets} scrape target(s) are unavailable."
                ),
            }
        )
    else:
        findings.append(
            "All Prometheus targets are healthy."
        )

        score_breakdown.append(
            {
                "category": "Prometheus",
                "change": 0,
                "reason": "All scrape targets are healthy.",
            }
        )

    health = max(0, health)

    if health >= 90:
        status = "healthy"
        summary = "Cluster is operating normally."
    elif health >= 70:
        status = "degraded"
        summary = "Cluster is healthy with minor issues."
    elif health >= 50:
        status = "warning"
        summary = "Cluster requires attention."
    else:
        status = "critical"
        summary = "Critical issues have been detected."

    if not recommendations:
        recommendations.append(
            "No immediate action is required. Continue monitoring."
        )

    return {
        "status": status,
        "health_score": health,
        "summary": summary,
        "findings": findings,
        "recommendations": recommendations,
        "score_breakdown": score_breakdown,
        "incidents": incidents,
        "metrics": {
            "cpu_usage_percent": cpu,
            "memory_usage_percent": memory,
            "healthy_targets": healthy_targets,
            "unhealthy_targets": unhealthy_targets,
            "total_targets": total_targets,
        },
    }