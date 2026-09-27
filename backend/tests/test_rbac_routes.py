import pytest
from fastapi.testclient import TestClient

import app as app_module
from routers import ai as ai_router
from routers import metrics as metrics_router


TOKEN_ENV_VARS = (
    "PLATFORM_VIEWER_TOKEN",
    "PLATFORM_OPERATOR_TOKEN",
    "PLATFORM_ADMIN_TOKEN",
)


@pytest.fixture(autouse=True)
def clear_auth_environment(monkeypatch):
    for env_name in TOKEN_ENV_VARS:
        monkeypatch.delenv(
            env_name,
            raising=False,
        )


@pytest.fixture
def client():
    return TestClient(app_module.app)


def configure_tokens(monkeypatch):
    monkeypatch.setenv(
        "PLATFORM_VIEWER_TOKEN",
        "viewer-secret",
    )
    monkeypatch.setenv(
        "PLATFORM_OPERATOR_TOKEN",
        "operator-secret",
    )
    monkeypatch.setenv(
        "PLATFORM_ADMIN_TOKEN",
        "admin-secret",
    )


def bearer(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
    }


def test_public_root_does_not_require_authentication(
    client,
):
    response = client.get("/")

    assert response.status_code == 200


def test_public_health_does_not_require_authentication(
    client,
):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_protected_route_fails_closed_when_auth_not_configured(
    client,
):
    response = client.get("/pods")

    assert response.status_code == 503


def test_protected_route_rejects_missing_token(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    response = client.get("/pods")

    assert response.status_code == 401
    assert (
        response.headers["www-authenticate"]
        == "Bearer"
    )


def test_protected_route_rejects_invalid_token(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    response = client.get(
        "/pods",
        headers=bearer("wrong-secret"),
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "token",
    [
        "viewer-secret",
        "operator-secret",
        "admin-secret",
    ],
)
def test_viewer_route_allows_viewer_operator_and_admin(
    client,
    monkeypatch,
    token,
):
    configure_tokens(monkeypatch)

    monkeypatch.setattr(
        app_module,
        "list_all_pods",
        lambda: [],
    )

    response = client.get(
        "/pods",
        headers=bearer(token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_metrics_routes_require_authentication(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    response = client.get(
        "/metrics/health"
    )

    assert response.status_code == 401


def test_viewer_can_access_metrics(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    monkeypatch.setattr(
        metrics_router,
        "get_prometheus_health",
        lambda: {
            "status": "healthy",
        },
    )

    response = client.get(
        "/metrics/health",
        headers=bearer("viewer-secret"),
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
    }


def test_ai_routes_require_authentication(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    response = client.get(
        "/ai/summary"
    )

    assert response.status_code == 401


def test_viewer_can_access_ai_summary(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    monkeypatch.setattr(
        ai_router,
        "generate_cluster_summary",
        lambda: {
            "health_score": 100,
            "summary": "Cluster is healthy.",
        },
    )

    response = client.get(
        "/ai/summary",
        headers=bearer("viewer-secret"),
    )

    assert response.status_code == 200
    assert response.json() == {
        "health_score": 100,
        "summary": "Cluster is healthy.",
    }


def test_viewer_cannot_use_operator_cloudops_route(
    client,
    monkeypatch,
):
    configure_tokens(monkeypatch)

    response = client.post(
        "/cloudops/findings",
        headers=bearer("viewer-secret"),
    )

    assert response.status_code == 403