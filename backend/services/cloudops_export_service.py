from typing import Any

from services.cloudops_service import (
    send_operational_finding,
)
from services.operational_finding_service import (
    build_operational_finding,
)


def export_incident(
    incident: dict[str, Any],
    *,
    finding_id: str,
    observed_at: str,
    environment: str,
    cluster: str,
) -> dict[str, Any]:
    """
    Transform one PlatformPilot incident and send it to CloudOps.

    The returned value includes both the exact finding that was sent
    and the response returned by CloudOps.
    """

    finding = build_operational_finding(
        incident,
        finding_id=finding_id,
        observed_at=observed_at,
        environment=environment,
        cluster=cluster,
    )

    cloudops_response = send_operational_finding(
        finding
    )

    return {
        "finding": finding,
        "cloudops": cloudops_response,
    }