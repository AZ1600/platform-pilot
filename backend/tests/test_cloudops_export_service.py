from services import cloudops_export_service


def test_export_incident_transforms_and_sends_finding(
    monkeypatch,
):
    incident = {
        "severity": "high",
        "source": "Kubernetes",
        "title": "Unhealthy Pod",
        "resource": "worker-api",
        "namespace": "production",
        "message": "Pod worker-api is CrashLoopBackOff.",
    }

    built_finding = {
        "findingId": "platform-pilot-worker-api-001",
        "schemaVersion": "1.0",
    }

    cloudops_response = {
        "platformPilotImport": {
            "findingId": "platform-pilot-worker-api-001",
            "status": "accepted",
        }
    }

    captured = {}

    def fake_build_operational_finding(
        received_incident,
        *,
        finding_id,
        observed_at,
        environment,
        cluster,
    ):
        captured["build"] = {
            "incident": received_incident,
            "finding_id": finding_id,
            "observed_at": observed_at,
            "environment": environment,
            "cluster": cluster,
        }

        return built_finding

    def fake_send_operational_finding(finding):
        captured["sent_finding"] = finding
        return cloudops_response

    monkeypatch.setattr(
        cloudops_export_service,
        "build_operational_finding",
        fake_build_operational_finding,
    )

    monkeypatch.setattr(
        cloudops_export_service,
        "send_operational_finding",
        fake_send_operational_finding,
    )

    result = cloudops_export_service.export_incident(
        incident,
        finding_id="platform-pilot-worker-api-001",
        observed_at="2026-07-19T10:45:00Z",
        environment="production",
        cluster="production-cluster",
    )

    assert captured["build"] == {
        "incident": incident,
        "finding_id": "platform-pilot-worker-api-001",
        "observed_at": "2026-07-19T10:45:00Z",
        "environment": "production",
        "cluster": "production-cluster",
    }

    assert captured["sent_finding"] is built_finding

    assert result == {
        "finding": built_finding,
        "cloudops": cloudops_response,
    }