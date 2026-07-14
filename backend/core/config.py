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

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]