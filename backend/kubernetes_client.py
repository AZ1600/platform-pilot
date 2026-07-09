from kubernetes import client, config
import ast

config.load_kube_config()

v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()


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

        results.append({
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "status": status,
        })

    return results


def get_pod_events(pod_name: str):
    events = v1.list_namespaced_event(namespace="default")
    results = []

    for event in events.items:
        if (
            event.involved_object.kind == "Pod"
            and event.involved_object.name == pod_name
        ):
            results.append({
                "reason": event.reason,
                "type": event.type,
                "message": event.message,
                "time": str(event.last_timestamp),
            })

    return results


def clean_log_text(logs):
    if isinstance(logs, bytes):
        return logs.decode("utf-8", errors="replace")

    if isinstance(logs, str) and logs.startswith("b'"):
        try:
            parsed = ast.literal_eval(logs)
            if isinstance(parsed, bytes):
                return parsed.decode("utf-8", errors="replace")
        except Exception:
            return logs[2:-1]

    return logs


def get_pod_logs(pod_name: str):
    try:
        logs = v1.read_namespaced_pod_log(
            name=pod_name,
            namespace="default",
            tail_lines=100,
        )

        return {
            "pod": pod_name,
            "logs": clean_log_text(logs),
        }

    except Exception as e:
        return {
            "pod": pod_name,
            "logs": "",
            "error": str(e),
        }


def list_deployments():
    deployments = apps_v1.list_namespaced_deployment(namespace="default")
    results = []

    for deployment in deployments.items:
        results.append({
            "name": deployment.metadata.name,
            "replicas": deployment.spec.replicas,
            "ready": deployment.status.ready_replicas or 0,
            "available": deployment.status.available_replicas or 0,
        })

    return results