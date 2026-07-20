import ast
from functools import lru_cache
from typing import Any

from kubernetes import client, config
from kubernetes.config.config_exception import ConfigException


@lru_cache(maxsize=1)
def _load_kubernetes_config() -> None:
    """
    Load Kubernetes credentials only when the application
    makes its first Kubernetes API request.

    When running inside Kubernetes, use the pod's service account.
    During local development, use the local kubeconfig file.

    Importing this module does not attempt to connect to Kubernetes,
    which allows unit tests to run in GitHub Actions without kubeconfig.
    """
    try:
        config.load_incluster_config()
    except ConfigException:
        config.load_kube_config()


class _LazyKubernetesClient:
    """
    Delay Kubernetes client creation until one of its methods
    is accessed for the first time.
    """

    def __init__(self, client_factory: Any) -> None:
        self._client_factory = client_factory
        self._client = None

    def __getattr__(self, attribute: str) -> Any:
        if self._client is None:
            _load_kubernetes_config()
            self._client = self._client_factory()

        return getattr(self._client, attribute)


v1 = _LazyKubernetesClient(client.CoreV1Api)
apps_v1 = _LazyKubernetesClient(client.AppsV1Api)


def list_pods():
    pods = v1.list_namespaced_pod(namespace="default")
    results = []

    for pod in pods.items:
        status = pod.status.phase

        if pod.status.container_statuses:
            container = pod.status.container_statuses[0]

            if container.state.waiting:
                status = container.state.waiting.reason
            elif container.state.terminated:
                status = container.state.terminated.reason

        results.append(
            {
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": status,
            }
        )

    return results


def list_all_pods():
    pods = v1.list_pod_for_all_namespaces()
    results = []

    for pod in pods.items:
        status = pod.status.phase

        if pod.status.container_statuses:
            container = pod.status.container_statuses[0]

            if container.state.waiting:
                status = container.state.waiting.reason
            elif container.state.terminated:
                status = container.state.terminated.reason

        results.append(
            {
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": status,
            }
        )

    return results


def get_pod_events(
    pod_name: str,
    namespace: str = "default",
):
    events = v1.list_namespaced_event(
        namespace=namespace,
    )

    results = []

    for event in events.items:
        involved_object = event.involved_object

        if (
            involved_object.kind == "Pod"
            and involved_object.name == pod_name
        ):
            event_time = (
                event.last_timestamp
                or event.event_time
                or event.first_timestamp
            )

            results.append(
                {
                    "reason": event.reason,
                    "type": event.type,
                    "message": event.message,
                    "time": str(event_time) if event_time else "",
                }
            )

    return results


def list_recent_events(limit: int = 10):
    events = v1.list_event_for_all_namespaces()
    results = []

    for event in events.items:
        event_time = (
            event.last_timestamp
            or event.event_time
            or event.first_timestamp
        )

        results.append(
            {
                "namespace": event.metadata.namespace,
                "reason": event.reason,
                "type": event.type,
                "message": event.message,
                "object": event.involved_object.name,
                "kind": event.involved_object.kind,
                "time": str(event_time) if event_time else "",
            }
        )

    results = sorted(
        results,
        key=lambda item: item["time"],
        reverse=True,
    )

    return results[:limit]


def clean_log_text(logs):
    if isinstance(logs, bytes):
        return logs.decode(
            "utf-8",
            errors="replace",
        )

    if isinstance(logs, str) and logs.startswith("b'"):
        try:
            parsed = ast.literal_eval(logs)

            if isinstance(parsed, bytes):
                return parsed.decode(
                    "utf-8",
                    errors="replace",
                )
        except (SyntaxError, ValueError):
            return logs[2:-1]

    return logs


def get_pod_logs(
    pod_name: str,
    namespace: str = "default",
    container_name: str | None = None,
):
    try:
        pod = v1.read_namespaced_pod(
            name=pod_name,
            namespace=namespace,
        )

        containers = [
            container.name
            for container in pod.spec.containers
        ]

        if container_name and container_name in containers:
            selected_container = container_name
        elif "grafana" in containers:
            selected_container = "grafana"
        elif containers:
            selected_container = containers[0]
        else:
            selected_container = None

        if not selected_container:
            return {
                "pod": pod_name,
                "namespace": namespace,
                "logs": "",
                "error": "No containers found in Pod.",
            }

        logs = v1.read_namespaced_pod_log(
            name=pod_name,
            namespace=namespace,
            container=selected_container,
            tail_lines=100,
        )

        return {
            "pod": pod_name,
            "namespace": namespace,
            "container": selected_container,
            "available_containers": containers,
            "logs": clean_log_text(logs),
        }

    except Exception as error:
        return {
            "pod": pod_name,
            "namespace": namespace,
            "logs": "",
            "error": str(error),
        }


def list_deployments():
    deployments = apps_v1.list_namespaced_deployment(
        namespace="default",
    )

    results = []

    for deployment in deployments.items:
        results.append(
            {
                "name": deployment.metadata.name,
                "namespace": deployment.metadata.namespace,
                "replicas": deployment.spec.replicas or 0,
                "ready": deployment.status.ready_replicas or 0,
                "available": (
                    deployment.status.available_replicas or 0
                ),
            }
        )

    return results


def list_all_deployments():
    deployments = (
        apps_v1.list_deployment_for_all_namespaces()
    )

    results = []

    for deployment in deployments.items:
        replicas = deployment.spec.replicas or 0
        ready = deployment.status.ready_replicas or 0
        available = (
            deployment.status.available_replicas or 0
        )

        results.append(
            {
                "name": deployment.metadata.name,
                "namespace": deployment.metadata.namespace,
                "replicas": replicas,
                "ready": ready,
                "available": available,
                "status": (
                    "Available"
                    if replicas == ready == available
                    else "Degraded"
                ),
            }
        )

    return results


def get_deployment_details(
    deployment_name: str,
    namespace: str = "default",
):
    deployment = apps_v1.read_namespaced_deployment(
        name=deployment_name,
        namespace=namespace,
    )

    selector = (
        deployment.spec.selector.match_labels or {}
    )

    label_selector = ",".join(
        f"{key}={value}"
        for key, value in selector.items()
    )

    pods = v1.list_namespaced_pod(
        namespace=namespace,
        label_selector=label_selector,
    )

    pod_names = [
        pod.metadata.name
        for pod in pods.items
    ]

    conditions = []

    if deployment.status.conditions:
        for condition in deployment.status.conditions:
            conditions.append(
                {
                    "type": condition.type,
                    "status": condition.status,
                    "reason": condition.reason,
                    "message": condition.message,
                }
            )

    replicas = deployment.spec.replicas or 0
    ready = deployment.status.ready_replicas or 0
    available = (
        deployment.status.available_replicas or 0
    )

    healthy = replicas == ready == available

    return {
        "name": deployment.metadata.name,
        "namespace": deployment.metadata.namespace,
        "replicas": replicas,
        "ready": ready,
        "available": available,
        "pods": pod_names,
        "conditions": conditions,
        "analysis": {
            "severity": (
                "Low"
                if healthy
                else "High"
            ),
            "root_cause": (
                "Deployment is healthy and all replicas "
                "are available."
                if healthy
                else (
                    "Deployment does not have all desired "
                    "replicas ready."
                )
            ),
            "recommendation": (
                "No action required."
                if healthy
                else (
                    "Inspect deployment conditions and "
                    "related pods."
                )
            ),
            "owner": "Platform Engineering",
        },
    }


def get_node_status(node):
    conditions = node.status.conditions or []

    for condition in conditions:
        if condition.type == "Ready":
            return (
                "Ready"
                if condition.status == "True"
                else "Not Ready"
            )

    return "Unknown"


def list_nodes():
    nodes = v1.list_node()
    results = []

    for node in nodes.items:
        node_info = node.status.node_info

        results.append(
            {
                "name": node.metadata.name,
                "status": get_node_status(node),
                "kubelet_version": (
                    node_info.kubelet_version
                ),
                "os": node_info.operating_system,
            }
        )

    return results


def get_node_details(node_name: str):
    try:
        node = v1.read_node(
            name=node_name,
        )
    except Exception:
        nodes = v1.list_node()

        node = next(
            (
                current_node
                for current_node in nodes.items
                if current_node.metadata.name
                == node_name
            ),
            None,
        )

    if not node:
        return {
            "error": "Node not found",
        }

    capacity = node.status.capacity or {}
    allocatable = node.status.allocatable or {}
    node_info = node.status.node_info
    node_status = get_node_status(node)

    return {
        "name": node.metadata.name,
        "status": node_status,
        "kubelet_version": (
            node_info.kubelet_version
        ),
        "os": node_info.operating_system,
        "architecture": node_info.architecture,
        "kernel_version": (
            node_info.kernel_version
        ),
        "container_runtime": (
            node_info.container_runtime_version
        ),
        "capacity": {
            "cpu": capacity.get("cpu"),
            "memory": capacity.get("memory"),
            "pods": capacity.get("pods"),
        },
        "allocatable": {
            "cpu": allocatable.get("cpu"),
            "memory": allocatable.get("memory"),
            "pods": allocatable.get("pods"),
        },
        "analysis": {
            "severity": (
                "Low"
                if node_status == "Ready"
                else "High"
            ),
            "root_cause": (
                "Node is healthy and kubelet is "
                "reporting Ready."
                if node_status == "Ready"
                else "Node is not reporting Ready."
            ),
            "recommendation": (
                "No action required."
                if node_status == "Ready"
                else (
                    "Inspect node conditions, kubelet "
                    "status, and resource pressure."
                )
            ),
            "owner": "Platform Engineering",
        },
    }


def list_namespaces():
    namespaces = v1.list_namespace()
    results = []

    for namespace in namespaces.items:
        results.append(
            {
                "name": namespace.metadata.name,
                "status": namespace.status.phase,
            }
        )

    return results


def get_namespace_details(
    namespace_name: str,
):
    try:
        namespace = v1.read_namespace(
            name=namespace_name,
        )
    except Exception:
        namespaces = v1.list_namespace()

        namespace = next(
            (
                current_namespace
                for current_namespace
                in namespaces.items
                if current_namespace.metadata.name
                == namespace_name
            ),
            None,
        )

    if not namespace:
        return {
            "error": "Namespace not found",
        }

    pods = v1.list_namespaced_pod(
        namespace=namespace_name,
    )

    deployments = (
        apps_v1.list_namespaced_deployment(
            namespace=namespace_name,
        )
    )

    services = v1.list_namespaced_service(
        namespace=namespace_name,
    )

    configmaps = v1.list_namespaced_config_map(
        namespace=namespace_name,
    )

    secrets = v1.list_namespaced_secret(
        namespace=namespace_name,
    )

    unhealthy_pods = sum(
        1
        for pod in pods.items
        if pod.status.phase != "Running"
    )

    return {
        "name": namespace.metadata.name,
        "status": namespace.status.phase,
        "pods": len(pods.items),
        "deployments": len(deployments.items),
        "services": len(services.items),
        "configmaps": len(configmaps.items),
        "secrets": len(secrets.items),
        "unhealthy_pods": unhealthy_pods,
        "analysis": {
            "severity": (
                "Low"
                if unhealthy_pods == 0
                else "Medium"
            ),
            "root_cause": (
                "Namespace resources appear healthy."
                if unhealthy_pods == 0
                else (
                    "One or more pods in this "
                    "namespace are unhealthy."
                )
            ),
            "recommendation": (
                "No action required."
                if unhealthy_pods == 0
                else (
                    "Review unhealthy pods in this "
                    "namespace."
                )
            ),
            "owner": "Platform Engineering",
        },
    }