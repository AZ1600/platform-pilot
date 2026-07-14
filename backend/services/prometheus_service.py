from typing import Any

import requests

from core.config import (
    PROMETHEUS_TIMEOUT_SECONDS,
    PROMETHEUS_URL,
)


class PrometheusError(RuntimeError):
    """Base exception for Prometheus-related failures."""


class PrometheusConnectionError(PrometheusError):
    """Raised when PlatformPilot cannot connect to Prometheus."""


class PrometheusQueryError(PrometheusError):
    """Raised when Prometheus rejects or fails a PromQL query."""


def query_prometheus(query: str) -> list[dict[str, Any]]:
    """
    Execute an instant PromQL query and return data.result.
    """

    try:
        response = requests.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={"query": query},
            timeout=PROMETHEUS_TIMEOUT_SECONDS,
        )

        response.raise_for_status()

    except requests.ConnectionError as exc:
        raise PrometheusConnectionError(
            "PlatformPilot could not connect to Prometheus. "
            "Confirm that the Prometheus port-forward is running "
            "on localhost:9090."
        ) from exc

    except requests.Timeout as exc:
        raise PrometheusConnectionError(
            "The Prometheus request timed out."
        ) from exc

    except requests.RequestException as exc:
        raise PrometheusConnectionError(
            f"Prometheus request failed: {exc}"
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise PrometheusQueryError(
            "Prometheus returned an invalid JSON response."
        ) from exc

    if payload.get("status") != "success":
        error_type = payload.get("errorType", "unknown")
        error_message = payload.get(
            "error",
            "Unknown Prometheus query error",
        )

        raise PrometheusQueryError(
            f"Prometheus query failed "
            f"({error_type}): {error_message}"
        )

    return payload.get("data", {}).get("result", [])


def extract_number(
    result: list[dict[str, Any]],
) -> float:
    """
    Extract the first numeric value from a Prometheus result.
    """

    if not result:
        return 0.0

    value = result[0].get("value")

    if not value or len(value) < 2:
        return 0.0

    try:
        return float(value[1])
    except (TypeError, ValueError):
        return 0.0


def parse_result_value(
    item: dict[str, Any],
) -> float:
    """
    Safely convert one Prometheus result value into a float.
    """

    value = item.get("value", [None, "0"])

    if len(value) < 2:
        return 0.0

    try:
        return float(value[1])
    except (TypeError, ValueError):
        return 0.0


def get_prometheus_health() -> dict[str, Any]:
    """
    Check the health of all Prometheus scrape targets.

    Prometheus metric:
        up = 1 means the target is healthy
        up = 0 means the target is unavailable
    """

    results = query_prometheus("up")

    healthy_targets = 0
    unhealthy_targets = 0

    for item in results:
        value = parse_result_value(item)

        if value == 1:
            healthy_targets += 1
        else:
            unhealthy_targets += 1

    total_targets = (
        healthy_targets + unhealthy_targets
    )

    if total_targets == 0:
        status = "unknown"
    elif unhealthy_targets == 0:
        status = "healthy"
    else:
        status = "degraded"

    return {
        "status": status,
        "reachable": True,
        "healthy_targets": healthy_targets,
        "unhealthy_targets": unhealthy_targets,
        "total_targets": total_targets,
    }


def get_pod_phase_metrics() -> dict[str, int]:
    """
    Count Pods currently in each Kubernetes phase.
    """

    phases = [
        "Running",
        "Pending",
        "Failed",
        "Succeeded",
        "Unknown",
    ]

    metrics: dict[str, int] = {}

    for phase in phases:
        query = (
            f'sum('
            f'kube_pod_status_phase'
            f'{{phase="{phase}"}} == 1'
            f')'
        )

        result = query_prometheus(query)

        metrics[phase.lower()] = int(
            extract_number(result)
        )

    metrics["total"] = sum(metrics.values())

    return metrics


def get_pods_by_namespace() -> list[dict[str, Any]]:
    """
    Return running Pod counts grouped by namespace.
    """

    query = """
    sum by (namespace) (
      kube_pod_status_phase{phase="Running"} == 1
    )
    """

    results = query_prometheus(query)

    namespaces: list[dict[str, Any]] = []

    for item in results:
        namespace = item.get(
            "metric",
            {},
        ).get(
            "namespace",
            "unknown",
        )

        running_pods = int(
            parse_result_value(item)
        )

        namespaces.append(
            {
                "namespace": namespace,
                "running_pods": running_pods,
            }
        )

    return sorted(
        namespaces,
        key=lambda item: item["namespace"],
    )


def get_node_health() -> list[dict[str, Any]]:
    """
    Return the Ready condition for every Kubernetes node.
    """

    query = """
    kube_node_status_condition{
      condition="Ready",
      status="true"
    }
    """

    results = query_prometheus(query)

    nodes: list[dict[str, Any]] = []

    for item in results:
        metric = item.get("metric", {})

        node_name = metric.get(
            "node",
            "unknown",
        )

        ready_value = parse_result_value(item)
        is_ready = ready_value == 1

        nodes.append(
            {
                "node": node_name,
                "ready": is_ready,
                "status": (
                    "Ready"
                    if is_ready
                    else "Not Ready"
                ),
            }
        )

    return sorted(
        nodes,
        key=lambda item: item["node"],
    )


def get_node_cpu_usage() -> list[dict[str, Any]]:
    """
    Return CPU usage percentage for each node-exporter instance.

    The query calculates:

        100 - idle CPU percentage
    """

    query = """
    100 - (
      avg by (instance) (
        rate(
          node_cpu_seconds_total{
            mode="idle"
          }[5m]
        )
      ) * 100
    )
    """

    results = query_prometheus(query)

    nodes: list[dict[str, Any]] = []

    for item in results:
        metric = item.get("metric", {})

        instance = metric.get(
            "instance",
            "unknown",
        )

        cpu_usage = round(
            parse_result_value(item),
            2,
        )

        nodes.append(
            {
                "instance": instance,
                "cpu_usage_percent": cpu_usage,
            }
        )

    return sorted(
        nodes,
        key=lambda item: item["instance"],
    )


def get_node_memory_usage() -> list[dict[str, Any]]:
    """
    Return memory usage percentage for each node.

    Formula:

        used memory =
        total memory - available memory
    """

    query = """
    (
      1 -
      (
        node_memory_MemAvailable_bytes
        /
        node_memory_MemTotal_bytes
      )
    ) * 100
    """

    results = query_prometheus(query)

    nodes: list[dict[str, Any]] = []

    for item in results:
        metric = item.get("metric", {})

        instance = metric.get(
            "instance",
            "unknown",
        )

        memory_usage = round(
            parse_result_value(item),
            2,
        )

        nodes.append(
            {
                "instance": instance,
                "memory_usage_percent": (
                    memory_usage
                ),
            }
        )

    return sorted(
        nodes,
        key=lambda item: item["instance"],
    )


def get_cluster_metrics() -> dict[str, Any]:
    """
    Return one combined observability response for the dashboard.
    """

    pod_metrics = get_pod_phase_metrics()
    node_health = get_node_health()
    cpu_metrics = get_node_cpu_usage()
    memory_metrics = get_node_memory_usage()
    prometheus_health = get_prometheus_health()

    ready_nodes = sum(
        1
        for node in node_health
        if node["ready"]
    )

    unhealthy_nodes = (
        len(node_health) - ready_nodes
    )

    return {
        "prometheus": prometheus_health,
        "pods": pod_metrics,
        "nodes": {
            "total": len(node_health),
            "ready": ready_nodes,
            "unhealthy": unhealthy_nodes,
            "items": node_health,
        },
        "cpu": cpu_metrics,
        "memory": memory_metrics,
    }