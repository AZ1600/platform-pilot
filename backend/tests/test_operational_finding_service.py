from services.operational_finding_service import build_operational_finding


def test_builds_cloudops_finding_from_kubernetes_incident():
    incident = {
        "severity": "high",
        "source": "Kubernetes",
        "title": "Unhealthy Pod",
        "resource": "worker-api",
        "namespace": "production",
        "message": "Pod worker-api is currently CrashLoopBackOff.",
    }

    finding = build_operational_finding(
        incident,
        finding_id="platform-pilot-worker-api-001",
        observed_at="2026-07-19T00:15:00Z",
        environment="production",
        cluster="production-cluster",
    )

    assert finding == {
        "schemaVersion": "1.0",
        "findingId": "platform-pilot-worker-api-001",
        "source": "platform-pilot",
        "observedAt": "2026-07-19T00:15:00Z",
        "environment": "production",
        "cluster": "production-cluster",
        "namespace": "production",
        "resource": {
            "kind": "Pod",
            "name": "worker-api",
        },
        "service": "worker-api",
        "category": "workload-health",
        "severity": "high",
        "confidence": 0.9,
        "summary": "Unhealthy Pod",
        "evidence": [
            "Pod worker-api is currently CrashLoopBackOff.",
            "Detected by Kubernetes.",
        ],
        "recommendedRunbook": "kubernetes-workload-investigation",
        "approvalRequired": True,
        "correlationId": "platform-pilot-worker-api-001",
    }

def test_normalizes_prometheus_warning_incident():
    incident = {
        "severity": "warning",
        "source": "Prometheus",
        "title": "Prometheus targets unavailable",
        "message": "Two Prometheus scrape targets are unavailable.",
    }

    finding = build_operational_finding(
        incident,
        finding_id="platform-pilot-prometheus-001",
        observed_at="2026-07-19T09:30:00Z",
        environment="production",
        cluster="production-cluster",
    )

    assert finding == {
        "schemaVersion": "1.0",
        "findingId": "platform-pilot-prometheus-001",
        "source": "platform-pilot",
        "observedAt": "2026-07-19T09:30:00Z",
        "environment": "production",
        "cluster": "production-cluster",
        "service": "prometheus",
        "category": "observability",
        "severity": "medium",
        "confidence": 0.9,
        "summary": "Prometheus targets unavailable",
        "evidence": [
            "Two Prometheus scrape targets are unavailable.",
            "Detected by Prometheus.",
        ],
        "recommendedRunbook": "prometheus-target-investigation",
        "approvalRequired": True,
        "correlationId": "platform-pilot-prometheus-001",
    }

def test_builds_node_resource_for_node_incident():
    incident = {
        "severity": "critical",
        "source": "Kubernetes",
        "title": "Node not ready",
        "resource": "worker-node-02",
        "message": "Node worker-node-02 is NotReady.",
    }

    finding = build_operational_finding(
        incident,
        finding_id="platform-pilot-node-001",
        observed_at="2026-07-19T10:30:00Z",
        environment="production",
        cluster="production-cluster",
    )

    assert finding["resource"] == {
        "kind": "Node",
        "name": "worker-node-02",
    }
    assert finding["service"] == "worker-node-02"
    assert finding["category"] == "workload-health"
    assert finding["severity"] == "critical"
    assert (
        finding["recommendedRunbook"]
        == "kubernetes-node-investigation"
    )