import pytest
from fastapi import HTTPException, Request

from core.security import (
    Principal,
    authenticate_request,
    require_role,
)


TOKEN_ENV_VARS = (
    "PLATFORM_VIEWER_TOKEN",
    "PLATFORM_OPERATOR_TOKEN",
    "PLATFORM_ADMIN_TOKEN",
)


def make_request(
    authorization: str | None = None,
) -> Request:
    headers = []

    if authorization is not None:
        headers.append(
            (
                b"authorization",
                authorization.encode(),
            )
        )

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/cloudops/findings",
            "headers": headers,
            "query_string": b"",
        }
    )


@pytest.fixture(autouse=True)
def clear_auth_environment(monkeypatch):
    for env_name in TOKEN_ENV_VARS:
        monkeypatch.delenv(
            env_name,
            raising=False,
        )


def test_authentication_requires_configuration():
    with pytest.raises(HTTPException) as exc:
        authenticate_request(make_request())

    assert exc.value.status_code == 503


def test_authentication_rejects_missing_bearer_token(
    monkeypatch,
):
    monkeypatch.setenv(
        "PLATFORM_OPERATOR_TOKEN",
        "operator-secret",
    )

    with pytest.raises(HTTPException) as exc:
        authenticate_request(make_request())

    assert exc.value.status_code == 401
    assert (
        exc.value.headers["WWW-Authenticate"]
        == "Bearer"
    )


def test_authentication_rejects_invalid_token(
    monkeypatch,
):
    monkeypatch.setenv(
        "PLATFORM_OPERATOR_TOKEN",
        "operator-secret",
    )

    with pytest.raises(HTTPException) as exc:
        authenticate_request(
            make_request("Bearer wrong-secret")
        )

    assert exc.value.status_code == 401


@pytest.mark.parametrize(
    ("env_name", "token", "expected_role"),
    [
        (
            "PLATFORM_VIEWER_TOKEN",
            "viewer-secret",
            "viewer",
        ),
        (
            "PLATFORM_OPERATOR_TOKEN",
            "operator-secret",
            "operator",
        ),
        (
            "PLATFORM_ADMIN_TOKEN",
            "admin-secret",
            "admin",
        ),
    ],
)
def test_token_maps_to_expected_role(
    monkeypatch,
    env_name,
    token,
    expected_role,
):
    monkeypatch.setenv(
        env_name,
        token,
    )

    principal = authenticate_request(
        make_request(f"Bearer {token}")
    )

    assert principal.role == expected_role


def test_operator_role_rejects_viewer():
    dependency = require_role("operator")

    with pytest.raises(HTTPException) as exc:
        dependency(
            Principal(role="viewer")
        )

    assert exc.value.status_code == 403


@pytest.mark.parametrize(
    "role",
    [
        "operator",
        "admin",
    ],
)
def test_operator_role_allows_operator_and_admin(
    role,
):
    dependency = require_role("operator")

    principal = Principal(role=role)

    assert dependency(principal) == principal
