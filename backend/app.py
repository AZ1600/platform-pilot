from fastapi import FastAPI
from kubernetes_client import (
    list_pods,
    get_pod_events,
    list_deployments,
)
from ai import analyze_pod

app = FastAPI(title="PlatformPilot API")


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