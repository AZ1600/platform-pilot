"""Regression checks for malformed Prometheus responses and metric values.

No external Prometheus or Kubernetes cluster is required.
"""

import pytest
from fastapi import HTTPException

from routers.metrics import execute_metrics_function
from services import prometheus_service as prometheus


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


def query_with_payload(monkeypatch, payload):
    def fake_get(url, *, params, timeout):
        assert url.endswith("/api/v1/query")
        assert params == {"query": "up"}
        assert timeout == prometheus.PROMETHEUS_TIMEOUT_SECONDS
        return FakeResponse(payload)

    monkeypatch.setattr(prometheus.requests, "get", fake_get)
    return prometheus.query_prometheus("up")


def test_valid_prometheus_response_preserves_samples(monkeypatch):
    values = [{"metric": {"job": "api"}, "value": [1234, "1"]}]
    payload = {"status": "success", "data": {"result": values}}
    assert query_with_payload(monkeypatch, payload) == values


def test_empty_valid_result_is_not_an_error(monkeypatch):
    assert query_with_payload(
        monkeypatch, {"status": "success", "data": {"result": []}}
    ) == []
    assert prometheus.extract_number([]) == 0.0


@pytest.mark.parametrize("payload", [
    [],
    {"status": "success"},
    {"status": "success", "data": None},
    {"status": "success", "data": {"result": {}}},
    {"status": "success", "data": {"result": [None]}},
])
def test_malformed_prometheus_payload_is_rejected(monkeypatch, payload):
    with pytest.raises(prometheus.PrometheusQueryError, match="unexpected response format"):
        query_with_payload(monkeypatch, payload)


def test_explicit_prometheus_failure_is_rejected(monkeypatch):
    with pytest.raises(prometheus.PrometheusQueryError, match="bad_data"):
        query_with_payload(monkeypatch, {
            "status": "error", "errorType": "bad_data", "error": "invalid query"
        })


@pytest.mark.parametrize("sample", ["NaN", "+Inf", "-Inf", "Infinity"])
def test_non_finite_samples_fail_closed(sample):
    with pytest.raises(prometheus.PrometheusQueryError, match="non-finite"):
        prometheus.parse_result_value({"value": [1234, sample]})
    with pytest.raises(prometheus.PrometheusQueryError, match="non-finite"):
        prometheus.extract_number([{"value": [1234, sample]}])


@pytest.mark.parametrize("sample", [None, "garbled", "", {}])
def test_non_numeric_samples_are_not_treated_as_zero(sample):
    with pytest.raises(prometheus.PrometheusQueryError, match="non-numeric"):
        prometheus.parse_result_value({"value": [1234, sample]})


@pytest.mark.parametrize("sample", [None, "bad sample", [1234]])
def test_malformed_samples_are_rejected(sample):
    with pytest.raises(prometheus.PrometheusQueryError, match="malformed"):
        prometheus.parse_result_value({"value": sample})


def test_finite_sample_values_remain_supported():
    assert prometheus.parse_result_value({"value": [1234, "0"]}) == 0.0
    assert prometheus.parse_result_value({"value": [1234, "3.5"]}) == 3.5
    assert prometheus.extract_number([{"value": [1234, "5"]}]) == 5.0


def test_unreliable_samples_are_mapped_to_http_502():
    def bad_metric():
        return prometheus.parse_result_value({"value": [1234, "NaN"]})

    with pytest.raises(HTTPException) as exc:
        execute_metrics_function(bad_metric)

    assert exc.value.status_code == 502
    assert "non-finite" in exc.value.detail
