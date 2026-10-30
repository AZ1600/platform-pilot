
# PlatformPilot Roadmap

This roadmap tracks implemented capabilities and potential future improvements for PlatformPilot.

## Implemented Capabilities

### Kubernetes Observability
- Kubernetes resource monitoring
- Cluster health dashboard
- Pod, Deployment, Node and Namespace inspection
- Prometheus metrics integration
- Performance analytics
- Kubernetes events and container logs

### Operational Intelligence
- Rule-based cluster health assessment
- Operational findings and recommendations
- Incident investigation
- AI-assisted operations interface
- CloudOps Command Center finding export

### Authentication and Security
- Role-scoped bearer-token authentication
- Viewer, Operator and Admin roles
- Server-side API authorization
- Fail-closed authentication behaviour
- Authenticated `/auth/me` endpoint
- Frontend runtime token validation
- Session-scoped API token storage
- Separate CloudOps integration credentials
- Security regression tests

### Engineering Quality
- Backend Pytest regression suite
- Frontend ESLint validation
- Vite production builds
- GitHub Actions CI
- Frontend dependency security remediation
- Frontend bundle code splitting

## Planned — v2.1

Focus: Identity and operational reliability.

- OIDC and SSO integration
- Microsoft Entra ID support
- Short-lived managed authentication sessions
- Historical metrics persistence
- WebSocket-based live updates
- Additional frontend automated tests

## Planned — v2.2

Focus: Extended Kubernetes operations.

- Multi-cluster monitoring
- Grafana integration
- Helm release monitoring
- GitOps integration
- Expanded operational telemetry
- End-to-end Kubernetes integration tests

## Future — v3.0

Focus: Advanced operational intelligence.

- Interactive AI operations assistant
- Expanded LLM-based root-cause analysis
- Predictive incident detection
- Cost optimization analysis
- Independent evaluation of AI-generated recommendations
- Production-grade security and deployment hardening

## Engineering Principles

- Preserve server-side authorization boundaries.
- Require explicit approval for operational remediation.
- Separate observed infrastructure evidence from recommendations.
- Test changes before merging.
- Avoid exposing secrets in source code.
- Clearly distinguish implemented features from future plans.

---

Roadmap items are proposed engineering directions, not guarantees of delivery or currently deployed functionality.
