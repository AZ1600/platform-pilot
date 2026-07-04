from kubernetes import client, config

# Load your local Kubernetes configuration
config.load_kube_config()

# Kubernetes API clients
v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()


def list_pods():
    """
    Return all pods with their current status.
    Detects waiting/terminated states such as:
    - ImagePullBackOff
    - CrashLoopBackOff
    - ErrImagePull
    """

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


def get_pod_events(pod_name: str):
    """
    Return Kubernetes events for a specific pod.
    """

    events = v1.list_namespaced_event(namespace="default")

    results = []

    for event in events.items:

        if (
            event.involved_object.kind == "Pod"
            and event.involved_object.name == pod_name
        ):
            results.append(
                {
                    "reason": event.reason,
                    "type": event.type,
                    "message": event.message,
                    "time": str(event.last_timestamp),
                }
            )

    return results


def list_deployments():
    """
    Return all deployments in the default namespace.
    """

    deployments = apps_v1.list_namespaced_deployment(namespace="default")

    results = []

    for deployment in deployments.items:

        results.append(
            {
                "name": deployment.metadata.name,
                "replicas": deployment.spec.replicas,
                "available": deployment.status.available_replicas or 0,
                "ready": deployment.status.ready_replicas or 0,
            }
        )

    return results