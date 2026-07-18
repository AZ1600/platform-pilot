from core import config


def test_config_exposes_platformpilot_identity():
    assert config.APP_NAME == "PlatformPilot API"
    assert config.APP_VERSION == "2.0.0"


def test_cloudops_config_has_safe_local_defaults():
    assert config.CLOUDOPS_FINDINGS_URL == (
        "http://127.0.0.1:3000/api/platform-pilot/findings"
    )
    assert config.CLOUDOPS_TIMEOUT_SECONDS == 10
    assert config.CLOUDOPS_INGEST_TOKEN is None