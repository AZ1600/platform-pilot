from routers import cloudops


def test_export_findings_analyzes_and_exports_incidents(
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

    monkeypatch.setattr(
        cloudops,
        "generate_cluster_summary",
        lambda: {
            "incidents": [incident],
        },
    )

    captured = {}

    def fake_export_incident(
        received_incident,
        *,
        finding_id,
        observed_at,
        environment,
        cluster,
    ):
        captured["incident"] = received_incident
        captured["finding_id"] = finding_id
        captured["observed_at"] = observed_at
        captured["environment"] = environment
        captured["cluster"] = cluster

        return {
            "finding": {
                "findingId": finding_id,
            },
            "cloudops": {
                "status": "accepted",
            },
        }

    monkeypatch.setattr(
        cloudops,
        "export_incident",
        fake_export_incident,
    )

    result = cloudops.export_findings()

    assert result["incidentCount"] == 1
    assert result["exportedCount"] == 1
    assert len(result["exports"]) == 1

    assert captured["incident"] == incident

    assert captured["finding_id"].startswith(
        "platform-pilot-"
    )

    assert captured["observed_at"].endswith("Z")
    assert captured["environment"] == "local"
    assert captured["cluster"] == "docker-desktop"

def test_cloudops_export_route_is_registered():
    from app import app

    registered_paths = set(
        app.openapi()["paths"]
    )

    assert "/cloudops/findings" in registered_paths