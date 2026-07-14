from collections.abc import Callable
from typing import Any

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from services.prometheus_service import (
    PrometheusConnectionError,
    PrometheusQueryError,
    get_cluster_metrics,
    get_node_cpu_usage,
    get_node_health,
    get_node_memory_usage,
    get_pod_phase_metrics,
    get_pods_by_namespace,
    get_prometheus_health,
)


router = APIRouter(
    prefix="/metrics",
    tags=["Prometheus Metrics"],
)


def handle_prometheus_error(
    exc: Exception,
) -> HTTPException:
    """
    Convert internal Prometheus errors into API responses.
    """

    if isinstance(
        exc,
        PrometheusConnectionError,
    ):
        return HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=str(exc),
        )

    if isinstance(
        exc,
        PrometheusQueryError,
    ):
        return HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=str(exc),
        )

    return HTTPException(
        status_code=(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ),
        detail=(
            "Unexpected Prometheus "
            "integration error."
        ),
    )


def execute_metrics_function(
    function: Callable[[], Any],
) -> Any:
    """
    Run a metrics service function with shared error handling.
    """

    try:
        return function()

    except (
        PrometheusConnectionError,
        PrometheusQueryError,
    ) as exc:
        raise handle_prometheus_error(
            exc
        ) from exc


@router.get("/health")
def prometheus_health():
    return execute_metrics_function(
        get_prometheus_health
    )


@router.get("/pods")
def pod_metrics():
    return execute_metrics_function(
        get_pod_phase_metrics
    )


@router.get("/pods/namespaces")
def pod_metrics_by_namespace():
    namespaces = execute_metrics_function(
        get_pods_by_namespace
    )

    return {
        "namespaces": namespaces,
    }


@router.get("/nodes")
def node_health():
    nodes = execute_metrics_function(
        get_node_health
    )

    return {
        "nodes": nodes,
    }


@router.get("/cpu")
def node_cpu():
    nodes = execute_metrics_function(
        get_node_cpu_usage
    )

    return {
        "nodes": nodes,
    }


@router.get("/memory")
def node_memory():
    nodes = execute_metrics_function(
        get_node_memory_usage
    )

    return {
        "nodes": nodes,
    }


@router.get("/cluster")
def cluster_metrics():
    return execute_metrics_function(
        get_cluster_metrics
    )