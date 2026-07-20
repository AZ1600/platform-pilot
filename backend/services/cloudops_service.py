from typing import Any

import requests

from core.config import (
    CLOUDOPS_FINDINGS_URL,
    CLOUDOPS_INGEST_TOKEN,
    CLOUDOPS_TIMEOUT_SECONDS,
)


class CloudOpsError(RuntimeError):
    """Base exception for CloudOps delivery failures."""


class CloudOpsConfigurationError(CloudOpsError):
    """Raised when CloudOps sender settings are missing."""


class CloudOpsConnectionError(CloudOpsError):
    """Raised when PlatformPilot cannot reach CloudOps."""


class CloudOpsAuthenticationError(CloudOpsError):
    """Raised when CloudOps rejects the sender token."""


class CloudOpsValidationError(CloudOpsError):
    """Raised when CloudOps rejects a finding contract."""

    def __init__(
        self,
        validation_errors: list[str],
    ) -> None:
        self.validation_errors = validation_errors

        super().__init__(
            "CloudOps contract validation failed."
        )


class CloudOpsResponseError(CloudOpsError):
    """Raised when CloudOps returns an unusable response."""


def send_operational_finding(
    finding: dict[str, Any],
) -> dict[str, Any]:
    """
    Send one PlatformPilot operational finding to CloudOps.
    """

    token = (CLOUDOPS_INGEST_TOKEN or "").strip()

    if not token:
        raise CloudOpsConfigurationError(
            "CLOUDOPS_INGEST_TOKEN is not configured."
        )

    try:
        response = requests.post(
            CLOUDOPS_FINDINGS_URL,
            json=finding,
            headers={
                "Authorization": f"Bearer {token}",
            },
            timeout=CLOUDOPS_TIMEOUT_SECONDS,
        )

    except requests.Timeout as exc:
        raise CloudOpsConnectionError(
            "The CloudOps request timed out."
        ) from exc

    except requests.ConnectionError as exc:
        raise CloudOpsConnectionError(
            "PlatformPilot could not connect to CloudOps."
        ) from exc

    except requests.RequestException as exc:
        raise CloudOpsConnectionError(
            "The CloudOps request failed."
        ) from exc

    if response.status_code in {401, 403}:
        raise CloudOpsAuthenticationError(
            "CloudOps authorization failed."
        )

    if response.status_code == 422:
        validation_errors: list[str] = []

        try:
            validation_payload = response.json()
        except ValueError:
            validation_payload = {}

        if isinstance(validation_payload, dict):
            raw_errors = validation_payload.get(
                "validationErrors",
                [],
            )

            if isinstance(raw_errors, list):
                validation_errors = [
                    str(error)
                    for error in raw_errors
                ]

        raise CloudOpsValidationError(
            validation_errors
        )

    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise CloudOpsResponseError(
            f"CloudOps returned HTTP "
            f"{response.status_code}."
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise CloudOpsResponseError(
            "CloudOps returned invalid JSON."
        ) from exc

    if not isinstance(payload, dict):
        raise CloudOpsResponseError(
            "CloudOps returned an unexpected response."
        )

    return payload