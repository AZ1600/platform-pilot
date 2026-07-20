from routers.ai import router as ai_router
from routers.cloudops import router as cloudops_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai import analyze_pod
from kubernetes_client import (
    get_deployment_details,
    get_namespace_details,
    get_node_details,
    get_pod_events,
    get_pod_logs,
    list_all_deployments,
    list_all_pods,
    list_deployments,
    list_namespaces,
    list_nodes,
    list_pods,
    list_recent_events,
)
from routers.metrics import router as metrics_router


app = FastAPI(
    title="PlatformPilot API",
    version="2.0.0",
    description=(
        "AI-assisted Kubernetes operations and observability API."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register the Prometheus metrics routes.
#
# This adds:
# GET /metrics/health
# GET /metrics/pods
# GET /metrics/pods/namespaces
app.include_router(metrics_router)
app.include_router(ai_router)
app.include_router(cloudops_router)


@app.get("/")
def root():
    return {
        "message": "🚀 PlatformPilot API",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    """
    Check whether the PlatformPilot FastAPI application is running.

    This endpoint checks the application itself.

    Prometheus health is checked separately through:
    GET /metrics/health
    """

    return {
        "status": "healthy",
        "service": "platformpilot-api",
        "version": "2.0.0",
    }


@app.get("/pods")
def get_pods():
    return list_all_pods()


@app.get("/deployments")
def get_deployments():
    return list_all_deployments()


@app.get("/deployments/{deployment_name}")
def deployment_details(deployment_name: str):
    return get_deployment_details(deployment_name)


@app.get("/nodes")
def nodes():
    return list_nodes()


@app.get("/nodes/{node_name}")
def node_details(node_name: str):
    return get_node_details(node_name)


@app.get("/namespaces")
def namespaces():
    return list_namespaces()


@app.get("/namespaces/{namespace_name}")
def namespace_details(namespace_name: str):
    return get_namespace_details(namespace_name)


@app.get("/events/recent")
def recent_events():
    return list_recent_events()


@app.get("/events/{pod_name}")
def events(pod_name: str):
    return get_pod_events(pod_name)


@app.get("/logs/{pod_name}")
def logs(pod_name: str):
    return get_pod_logs(pod_name)


@app.get("/risks")
def risks():
    pods = list_pods()
    results = []

    for pod in pods:
        if pod["status"] != "Running":
            analysis = analyze_pod(pod)

            results.append(
                {
                    **pod,
                    **analysis,
                }
            )

    return {
        "total_pods": len(pods),
        "risk_count": len(results),
        "risks": results,
    }


@app.get("/analysis")
def analysis():
    pods = list_pods()
    results = []

    for pod in pods:
        if pod["status"] != "Running":
            events = get_pod_events(pod["name"])
            logs = get_pod_logs(pod["name"])
            recommendation = analyze_pod(pod)

            results.append(
                {
                    "pod": pod,
                    "events": events,
                    "logs": logs,
                    "analysis": recommendation,
                }
            )

    return {
        "total_pods": len(pods),
        "issue_count": len(results),
        "issues": results,
    }


@app.get("/analysis/{namespace}/{pod_name}")
def pod_analysis(namespace: str, pod_name: str):
    pods = list_all_pods()

    pod = next(
        (
            pod
            for pod in pods
            if (
                pod["name"] == pod_name
                and pod["namespace"] == namespace
            )
        ),
        None,
    )

    if not pod:
        return {
            "error": "Pod not found",
        }

    events = get_pod_events(
        pod_name,
        namespace,
    )

    logs = get_pod_logs(
        pod_name,
        namespace,
    )

    recommendation = analyze_pod(pod)

    return {
        "pod": pod,
        "events": events,
        "logs": logs,
        "analysis": recommendation,
    }


@app.get("/cluster-summary")
def cluster_summary():
    pods = list_all_pods()
    deployments = list_all_deployments()
    nodes = list_nodes()
    namespaces = list_namespaces()
    events = list_recent_events()

    running_pods = sum(
        1
        for pod in pods
        if pod["status"] == "Running"
    )

    failed_pods = len(pods) - running_pods

    healthy_deployments = sum(
        1
        for deployment in deployments
        if deployment["replicas"]
        == deployment["ready"]
        == deployment["available"]
    )

    degraded_deployments = (
        len(deployments) - healthy_deployments
    )

    ready_nodes = sum(
        1
        for node in nodes
        if node["status"] == "Ready"
    )

    unhealthy_nodes = len(nodes) - ready_nodes

    active_namespaces = sum(
        1
        for namespace in namespaces
        if namespace["status"] == "Active"
    )

    incidents = []

    for pod in pods:
        if pod["status"] != "Running":
            incidents.append(
                {
                    "type": "Pod",
                    "name": pod["name"],
                    "namespace": pod["namespace"],
                    "status": pod["status"],
                    "severity": "High",
                    "message": (
                        f"Pod {pod['name']} is "
                        f"{pod['status']}"
                    ),
                }
            )

    for deployment in deployments:
        deployment_is_healthy = (
            deployment["replicas"]
            == deployment["ready"]
            == deployment["available"]
        )

        if not deployment_is_healthy:
            incidents.append(
                {
                    "type": "Deployment",
                    "name": deployment["name"],
                    "namespace": deployment["namespace"],
                    "status": "Degraded",
                    "severity": "High",
                    "message": (
                        f"Deployment {deployment['name']} "
                        "does not have all replicas ready."
                    ),
                }
            )

    health_score = 100
    health_score -= failed_pods * 15
    health_score -= degraded_deployments * 20
    health_score -= unhealthy_nodes * 25
    health_score = max(0, health_score)

    if health_score >= 90:
        summary = "Cluster is healthy."
    elif health_score >= 70:
        summary = "Cluster health is degraded."
    else:
        summary = "Cluster requires immediate attention."

    recommendations = []

    if failed_pods == 0:
        recommendations.append(
            "No pod failures detected."
        )
    else:
        recommendations.append(
            "Investigate non-running pods."
        )

    if degraded_deployments == 0:
        recommendations.append(
            "All deployments are healthy."
        )
    else:
        recommendations.append(
            "Review degraded deployments."
        )

    if unhealthy_nodes == 0:
        recommendations.append(
            "All nodes are Ready."
        )
    else:
        recommendations.append(
            "Investigate unhealthy nodes."
        )

    recommendations.append(
        "Continue monitoring cluster health."
    )

    return {
        "health_score": health_score,
        "summary": summary,
        "pods": {
            "total": len(pods),
            "running": running_pods,
            "failed": failed_pods,
        },
        "deployments": {
            "total": len(deployments),
            "healthy": healthy_deployments,
            "degraded": degraded_deployments,
        },
        "nodes": {
            "total": len(nodes),
            "ready": ready_nodes,
            "unhealthy": unhealthy_nodes,
        },
        "namespaces": {
            "total": len(namespaces),
            "active": active_namespaces,
        },
        "incidents": incidents,
        "recent_events": events,
        "recommendations": recommendations,
    }


@app.get("/dashboard")
def dashboard():
    pods = list_pods()
    deployments = list_deployments()

    incidents = []

    for pod in pods:
        if pod["status"] != "Running":
            incidents.append(
                {
                    **pod,
                    **analyze_pod(pod),
                    "events": get_pod_events(
                        pod["name"]
                    ),
                    "logs": get_pod_logs(
                        pod["name"]
                    ),
                }
            )

    return {
        "cluster_status": (
            "Healthy"
            if len(incidents) == 0
            else "Warning"
        ),
        "pods": len(pods),
        "deployments": len(deployments),
        "active_risks": len(incidents),
        "incidents": incidents,
    }