import app as app_module


def test_namespace_aware_pod_routes_are_registered():
    registered_paths = set(
        app_module.app.openapi()["paths"]
    )

    assert "/events/{namespace}/{pod_name}" in registered_paths
    assert "/logs/{namespace}/{pod_name}" in registered_paths
    assert "/analysis/{namespace}/{pod_name}" in registered_paths


def test_events_route_passes_namespace(monkeypatch):
    captured = {}

    def fake_get_pod_events(pod_name, namespace):
        captured["pod_name"] = pod_name
        captured["namespace"] = namespace
        return [{"reason": "Started"}]

    monkeypatch.setattr(
        app_module,
        "get_pod_events",
        fake_get_pod_events,
    )

    result = app_module.events(
        "production",
        "payments-api-123",
    )

    assert result == [{"reason": "Started"}]
    assert captured == {
        "pod_name": "payments-api-123",
        "namespace": "production",
    }


def test_logs_route_passes_namespace(monkeypatch):
    captured = {}

    def fake_get_pod_logs(pod_name, namespace):
        captured["pod_name"] = pod_name
        captured["namespace"] = namespace
        return {"logs": "ready"}

    monkeypatch.setattr(
        app_module,
        "get_pod_logs",
        fake_get_pod_logs,
    )

    result = app_module.logs(
        "production",
        "payments-api-123",
    )

    assert result == {"logs": "ready"}
    assert captured == {
        "pod_name": "payments-api-123",
        "namespace": "production",
    }