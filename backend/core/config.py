import os


APP_NAME = "PlatformPilot API"
APP_VERSION = "2.0.0"

PROMETHEUS_URL = os.getenv(
    "PROMETHEUS_URL",
    "http://127.0.0.1:9090",
)

PROMETHEUS_TIMEOUT_SECONDS = int(
    os.getenv("PROMETHEUS_TIMEOUT_SECONDS", "10")
)

CLOUDOPS_FINDINGS_URL = os.getenv(
    "CLOUDOPS_FINDINGS_URL",
    "http://127.0.0.1:3000/api/platform-pilot/findings",
)

CLOUDOPS_TIMEOUT_SECONDS = int(
    os.getenv("CLOUDOPS_TIMEOUT_SECONDS", "10")
)

CLOUDOPS_INGEST_TOKEN = os.getenv(
    "CLOUDOPS_INGEST_TOKEN"
)

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

PLATFORM_ENVIRONMENT = os.getenv(
    "PLATFORM_ENVIRONMENT",
    "local",
)

KUBERNETES_CLUSTER_NAME = os.getenv(
    "KUBERNETES_CLUSTER_NAME",
    "docker-desktop",
)