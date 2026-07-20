from typing import Any

import pytest
import requests

from services import cloudops_service


class FakeResponse:
    status_code = 200

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return {
            "platformPilotImport": {
                "findingId": "finding-001",
                "status": "accepted",
            }
        }


def test_send_operational_finding_posts_authenticated_json(
    monkeypatch,
):
    captured: dict[str, Any] = {}

    def fake_post(
        url: str,
        *,
        json: dict[str, Any],
        headers: dict[str, str],
        timeout: int,
    ) -> FakeResponse:
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        captured["timeout"] = timeout

        return FakeResponse()

    monkeypatch.setattr(
        requests,
        "post",
        fake_post,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        "local-test-token",
    )

    finding = {
        "schemaVersion": "1.0",
        "findingId": "finding-001",
    }

    result = cloudops_service.send_operational_finding(
        finding
    )

    assert captured == {
        "url": (
            "http://127.0.0.1:3000"
            "/api/platform-pilot/findings"
        ),
        "json": finding,
        "headers": {
            "Authorization": "Bearer local-test-token",
        },
        "timeout": 10,
    }

    assert result["platformPilotImport"]["status"] == (
        "accepted"
    )


def test_send_operational_finding_rejects_missing_token(
    monkeypatch,
):
    def fail_if_called(
        *args: Any,
        **kwargs: Any,
    ) -> None:
        raise AssertionError(
            "HTTP must not be called without a token"
        )

    monkeypatch.setattr(
        requests,
        "post",
        fail_if_called,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        None,
    )

    with pytest.raises(
        cloudops_service.CloudOpsConfigurationError,
        match="CLOUDOPS_INGEST_TOKEN",
    ):
        cloudops_service.send_operational_finding(
            {
                "schemaVersion": "1.0",
                "findingId": "finding-001",
            }
        )

def test_send_operational_finding_translates_timeout(
    monkeypatch,
):
    def timeout_post(
        *args: Any,
        **kwargs: Any,
    ) -> None:
        raise requests.Timeout(
            "simulated timeout"
        )

    monkeypatch.setattr(
        requests,
        "post",
        timeout_post,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        "local-test-token",
    )

    with pytest.raises(
        cloudops_service.CloudOpsConnectionError,
        match="timed out",
    ):
        cloudops_service.send_operational_finding(
            {
                "schemaVersion": "1.0",
                "findingId": "finding-001",
            }
        )

def test_send_operational_finding_translates_unauthorized(
    monkeypatch,
):
    class UnauthorizedResponse:
        status_code = 401

        def raise_for_status(self) -> None:
            raise requests.HTTPError(
                "401 Client Error",
                response=self,
            )

        def json(self) -> dict[str, str]:
            return {
                "error": (
                    "PlatformPilot authorization failed"
                )
            }

    def unauthorized_post(
        *args: Any,
        **kwargs: Any,
    ) -> UnauthorizedResponse:
        return UnauthorizedResponse()

    monkeypatch.setattr(
        requests,
        "post",
        unauthorized_post,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        "incorrect-token",
    )

    with pytest.raises(
        cloudops_service.CloudOpsAuthenticationError,
        match="authorization failed",
    ):
        cloudops_service.send_operational_finding(
            {
                "schemaVersion": "1.0",
                "findingId": "finding-001",
            }
        )

def test_send_operational_finding_preserves_validation_errors(
    monkeypatch,
):
    validation_errors = [
        "/summary: must NOT have fewer than 1 characters",
        "/evidence: must NOT have fewer than 1 items",
    ]

    class ValidationResponse:
        status_code = 422

        def raise_for_status(self) -> None:
            raise requests.HTTPError(
                "422 Client Error",
                response=self,
            )

        def json(self) -> dict[str, Any]:
            return {
                "error": (
                    "Operational finding failed validation"
                ),
                "validationErrors": validation_errors,
            }

    def validation_post(
        *args: Any,
        **kwargs: Any,
    ) -> ValidationResponse:
        return ValidationResponse()

    monkeypatch.setattr(
        requests,
        "post",
        validation_post,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        "local-test-token",
    )

    with pytest.raises(
        cloudops_service.CloudOpsValidationError,
        match="contract validation",
    ) as captured:
        cloudops_service.send_operational_finding(
            {
                "schemaVersion": "1.0",
                "findingId": "finding-001",
            }
        )

    assert captured.value.validation_errors == (
        validation_errors
    )

def test_send_operational_finding_translates_server_error(
    monkeypatch,
):
    class ServerErrorResponse:
        status_code = 500

        def raise_for_status(self) -> None:
            raise requests.HTTPError(
                "500 Server Error",
                response=self,
            )

        def json(self) -> dict[str, str]:
            return {
                "error": "Internal server error",
            }

    def server_error_post(
        *args: Any,
        **kwargs: Any,
    ) -> ServerErrorResponse:
        return ServerErrorResponse()

    monkeypatch.setattr(
        requests,
        "post",
        server_error_post,
    )

    monkeypatch.setattr(
        cloudops_service,
        "CLOUDOPS_INGEST_TOKEN",
        "local-test-token",
    )

    with pytest.raises(
        cloudops_service.CloudOpsResponseError,
        match="HTTP 500",
    ):
        cloudops_service.send_operational_finding(
            {
                "schemaVersion": "1.0",
                "findingId": "finding-001",
            }
        )