from typing import Any


ALLOWED_SEVERITIES = {
    "critical",
    "high",
    "medium",
    "low",
}


def normalize_severity(value: object) -> str:
    """
    Convert PlatformPilot severities into values accepted by CloudOps.
    """

    severity = str(value).strip().lower()

    if severity == "warning":
        return "medium"

    if severity in ALLOWED_SEVERITIES:
        return severity

    return "medium"


def build_operational_finding(
    incident: dict[str, Any],
    *,
    finding_id: str,
    observed_at: str,
    environment: str,
    cluster: str,
) -> dict[str, Any]:
    """
    Transform a PlatformPilot incident into the shared CloudOps
    operational-finding contract.
    """

    source = str(
        incident.get("source", "PlatformPilot")
    ).strip()

    source_key = source.lower()

    title = str(
        incident.get("title", "PlatformPilot finding")
    ).strip()

    message = str(
        incident.get("message", title)
    ).strip()

    finding: dict[str, Any] = {
        "schemaVersion": "1.0",
        "findingId": finding_id,
        "source": "platform-pilot",
        "observedAt": observed_at,
        "environment": environment,
        "cluster": cluster,
        "severity": normalize_severity(
            incident.get("severity", "medium")
        ),
        "confidence": 0.9,
        "summary": title,
        "evidence": [
            message,
            f"Detected by {source}.",
        ],
        "approvalRequired": True,
        "correlationId": finding_id,
    }

    if source_key == "kubernetes":
        resource_name = str(
            incident.get("resource", "unknown-resource")
        ).strip()

        is_node_incident = title.lower() == "node not ready"

        resource_kind = (
            "Node"
            if is_node_incident
            else "Pod"
        )

        runbook = (
            "kubernetes-node-investigation"
            if is_node_incident
            else "kubernetes-workload-investigation"
        )

        kubernetes_fields: dict[str, Any] = {
            "resource": {
                "kind": resource_kind,
                "name": resource_name,
            },
            "service": resource_name,
            "category": "workload-health",
            "recommendedRunbook": runbook,
        }

        if not is_node_incident:
            kubernetes_fields["namespace"] = str(
                incident.get("namespace", "default")
            ).strip()

        finding.update(kubernetes_fields)

        return finding

    if source_key == "prometheus":
        finding.update(
            {
                "service": "prometheus",
                "category": "observability",
                "recommendedRunbook": (
                    "prometheus-target-investigation"
                ),
            }
        )

        return finding

    finding.update(
        {
            "service": "platform-pilot",
            "category": "observability",
            "recommendedRunbook": (
                "platform-pilot-finding-investigation"
            ),
        }
    )

    return finding