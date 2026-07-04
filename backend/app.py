from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kubernetes_client import (
    list_pods,
    get_pod_events,
    get_pod_logs,
    list_deployments,
)
from ai import analyze_pod

app = FastAPI(title="PlatformPilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "🚀 PlatformPilot API"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/pods")
def pods():
    return list_pods()


@app.get("/deployments")
def deployments():
    return list_deployments()


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
            results.append({**pod, **analysis})

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

            results.append({
                "pod": pod,
                "events": events,
                "logs": logs,
                "analysis": recommendation,
            })

    return {
        "total_pods": len(pods),
        "issue_count": len(results),
        "issues": results,
    }

@app.get("/dashboard")
def dashboard():

    pods = list_pods()
    deployments = list_deployments()

    incidents = []

    for pod in pods:

        if pod["status"] != "Running":

            incidents.append({
                **pod,
                **analyze_pod(pod),
                "events": get_pod_events(pod["name"]),
                "logs": get_pod_logs(pod["name"]),
            })

    return {
        "cluster_status": "Healthy" if len(incidents) == 0 else "Warning",
        "pods": len(pods),
        "deployments": len(deployments),
        "active_risks": len(incidents),
        "incidents": incidents,
    }