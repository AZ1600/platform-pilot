from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter

from core.config import (
    KUBERNETES_CLUSTER_NAME,
    PLATFORM_ENVIRONMENT,
)
from services.ai_service import generate_cluster_summary
from services.cloudops_export_service import export_incident


router = APIRouter(
    prefix="/cloudops",
    tags=["CloudOps Integration"],
)


def utc_timestamp() -> str:
    """
    Return the current UTC time in JSON Schema date-time format.
    """

    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def new_finding_id() -> str:
    """
    Generate a unique PlatformPilot finding identifier.
    """

    return f"platform-pilot-{uuid4().hex}"


@router.post("/findings")
def export_findings() -> dict[str, Any]:
    """
    Analyze the cluster and export every detected incident to CloudOps.
    """

    summary = generate_cluster_summary()

    incidents = summary.get(
        "incidents",
        [],
    )

    exports = []

    for incident in incidents:
        exports.append(
            export_incident(
                incident,
                finding_id=new_finding_id(),
                observed_at=utc_timestamp(),
                environment=PLATFORM_ENVIRONMENT,
                cluster=KUBERNETES_CLUSTER_NAME,
            )
        )

    return {
        "incidentCount": len(incidents),
        "exportedCount": len(exports),
        "exports": exports,
    }