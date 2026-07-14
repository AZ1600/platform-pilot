from fastapi import APIRouter, HTTPException, status

from services.ai_service import generate_cluster_summary
from services.prometheus_service import (
    PrometheusConnectionError,
    PrometheusQueryError,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"],
)


@router.get("/summary")
def ai_summary():
    try:
        return generate_cluster_summary()

    except PrometheusConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except PrometheusQueryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PlatformPilot could not generate the AI cluster summary.",
        ) from exc