# 🚀 PlatformPilot

> **An AI-assisted Kubernetes Observability Platform for monitoring cluster health, analyzing workloads, enforcing role-based API access, and accelerating incident response.**

PlatformPilot combines Kubernetes APIs, Prometheus metrics, operational analysis, AI-assisted insights, and role-based access control into a modern dashboard designed for Platform Engineers, DevOps Engineers, and Site Reliability Engineers.

The platform can also export structured operational findings to CloudOps Command Center for approval-gated operational workflows.

---

## 🎥 Demo

<p align="center">
  <img src="screenshots/platformpilot-demo.gif" alt="PlatformPilot Demo" width="100%">
</p>

---

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.31-326CE5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

# 📖 Overview

PlatformPilot is a Kubernetes observability and operational-assistance platform that provides visibility into:

- cluster resources
- infrastructure health
- workloads
- Prometheus metrics
- incidents
- operational findings
- AI-assisted health summaries
- controlled CloudOps exports

Built with **React**, **FastAPI**, the **Kubernetes Python Client**, and **Prometheus**, PlatformPilot combines operational dashboards with analysis workflows that help engineers detect issues, investigate workloads, and make faster operational decisions.

The platform now also includes application-wide API role-based access control for protected read and operational endpoints.

---

# ✨ Key Features

### 📊 Cluster Observability

- Kubernetes Health Dashboard
- Live Cluster Monitoring
- Health Scoring
- Prometheus Metrics
- Performance Analytics
- Manual and Auto Refresh
- PDF Report Export

### 🤖 AI-Assisted Operations

- Operations Summary
- Root Cause Analysis Support
- Cluster Health Assessment
- Severity Classification
- Operational Recommendations
- Incident Detection

### 🔍 Productivity

- Global Kubernetes Search
- Command Palette with Ctrl+K / ⌘K
- Keyboard Navigation
- Instant Resource Discovery
- Search Pods, Deployments, Nodes, and Namespaces

### 📈 Infrastructure Monitoring

- Pods
- Deployments
- Nodes
- Namespaces
- Kubernetes Events
- Container Logs
- Resource Health Monitoring

### 🔐 Security and RBAC

- Bearer-token authentication
- `viewer`, `operator`, and `admin` roles
- viewer protection for read-oriented APIs
- operator protection for operational actions
- fail-closed authentication
- backend token validation
- browser session token handling
- authenticated role display in the frontend

### 🔗 CloudOps Integration

- Structured operational finding generation
- Authenticated delivery to CloudOps Command Center
- Environment and cluster metadata
- Unique finding identifiers
- Contract-driven incident export
- Separate PlatformPilot and CloudOps trust boundaries

---

# 🏗 Architecture

```text
                         React + Vite
                              │
                              │ Bearer Token
                              ▼
                       FastAPI Backend
                     Authentication + RBAC
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
 Kubernetes Python      Prometheus HTTP      Operational
      Client                  API              Analysis
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                      Kubernetes Cluster
                              │
                              ▼
                    Operational Findings
                              │
                              │ CloudOps Ingest Token
                              ▼
                 CloudOps Command Center
```

For a detailed architecture walkthrough, see:

```text
docs/ARCHITECTURE.md
```

---

# 🔐 API Security

PlatformPilot implements role-scoped bearer-token authentication across protected backend APIs.

The authorization model defines three roles:

```text
viewer
   │
   ▼
operator
   │
   ▼
admin
```

Higher roles inherit the permissions of lower roles.

---

## Viewer

The `viewer` role provides read-oriented access to PlatformPilot operational data.

Protected viewer endpoints include resources such as:

```text
Pods
Deployments
Nodes
Namespaces
Events
Logs
Analysis
Dashboard
Cluster Summary
Prometheus Metrics
AI Summary
```

A viewer can inspect operational state but cannot perform operator-level actions.

---

## Operator

The `operator` role inherits viewer access and can also perform operational actions.

For example:

```text
POST /cloudops/findings
```

requires at least:

```text
operator
```

A viewer attempting this operation receives:

```text
403 Forbidden
```

---

## Admin

The `admin` role inherits operator and viewer permissions.

It provides the highest current PlatformPilot API privilege level and is available for future administrative controls.

---

# 🔑 Authentication Behaviour

PlatformPilot follows a fail-closed model.

```text
Authentication not configured
        ↓
503 Service Unavailable
```

```text
Missing or invalid token
        ↓
401 Unauthorized
```

```text
Authenticated but insufficient role
        ↓
403 Forbidden
```

```text
Authenticated with sufficient role
        ↓
Request allowed
```

Bearer-token values are compared using constant-time comparison.

Configure authentication through environment variables:

```bash
export PLATFORM_VIEWER_TOKEN="replace-with-long-random-token"
export PLATFORM_OPERATOR_TOKEN="replace-with-long-random-token"
export PLATFORM_ADMIN_TOKEN="replace-with-long-random-token"
```

Use long randomly generated values.

Never commit real production credentials to the repository.

---

# 👤 Authenticated Principal Endpoint

PlatformPilot exposes:

```text
GET /auth/me
```

This endpoint validates the supplied bearer token without requiring Kubernetes or Prometheus connectivity.

Example authenticated response:

```json
{
  "authenticated": true,
  "role": "viewer"
}
```

This provides a simple way for clients and the frontend to confirm the active PlatformPilot role.

---

# 🖥 Frontend API Access

The React frontend supports runtime API authentication.

The flow is:

```text
User enters bearer token
        ↓
Frontend calls GET /auth/me
        ↓
FastAPI validates token
        ↓
Role returned
        ↓
Token stored in sessionStorage
        ↓
Authenticated API requests
```

The frontend does **not** bake PlatformPilot bearer tokens into the Vite production bundle.

Tokens are stored only in:

```text
sessionStorage
```

and therefore remain scoped to the current browser session.

The navigation displays the validated role:

```text
API Access ✓ · viewer
```

A token is only shown as authenticated after the backend successfully validates it.

![RBAC Viewer Session](screenshots/rbac-viewer-session.png)

---

# 🔒 Current Identity Scope

The current implementation provides:

```text
API authentication
Role-based authorization
Browser session token handling
Backend role validation
```

It is not intended to represent a complete enterprise identity platform.

Future identity enhancements may include:

```text
OIDC
SSO
Microsoft Entra ID
External identity providers
Short-lived access tokens
Centralized user and group management
```

---

# 🔗 CloudOps Security Boundary

PlatformPilot and CloudOps use separate authentication boundaries.

## Calling PlatformPilot

A caller requesting an operational export must authenticate to PlatformPilot with a role-scoped PlatformPilot bearer token.

```text
Caller
  │
  │ PlatformPilot operator/admin token
  ▼
POST /cloudops/findings
```

## PlatformPilot Calling CloudOps

After PlatformPilot authorization succeeds, the backend authenticates its outbound request to CloudOps using:

```text
CLOUDOPS_INGEST_TOKEN
```

```text
PlatformPilot
  │
  │ CloudOps ingest token
  ▼
CloudOps Command Center
```

This separation prevents reuse of one credential across both trust boundaries.

---

# 🧪 RBAC Validation

The security model has been validated at both automated-test and runtime levels.

Runtime behaviour demonstrated:

```text
Missing / bad token
        ↓
401 Unauthorized
```

```text
Viewer token
        ↓
GET /auth/me
        ↓
200 OK
role = viewer
```

```text
Viewer token
        ↓
POST /cloudops/findings
        ↓
403 Forbidden
```

```text
Operator token
        ↓
GET /auth/me
        ↓
200 OK
role = operator
```

The CloudOps action itself may still depend on Kubernetes, Prometheus, and CloudOps connectivity after authorization succeeds.

This separation demonstrates that authentication and authorization are evaluated before downstream operational dependencies.

---

# 🧪 Automated Validation

The backend security and integration layers are covered by automated tests.

Current backend verification:

```text
44 tests passed
```

The test suite covers:

- CloudOps export services
- CloudOps route behavior
- CloudOps delivery failures
- configuration handling
- operational finding generation
- Kubernetes pod routes
- bearer-token authentication
- role mapping
- viewer authorization
- operator authorization
- admin authorization
- protected read endpoints
- Prometheus endpoint authentication
- AI endpoint authentication
- public health access
- `/auth/me`
- HTTP `401`
- HTTP `403`
- successful authenticated requests

The frontend is validated with:

```bash
npm run lint
npm run build
```

GitHub Actions runs backend tests and frontend validation on pull requests and pushes to `main`.

---

# 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite, CSS3 |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Kubernetes | Kubernetes Python Client |
| Monitoring | Prometheus |
| Security | Bearer-token authentication, RBAC, sessionStorage |
| Integration | CloudOps operational finding API |
| Testing | Pytest, FastAPI TestClient, HTTPX |
| CI | GitHub Actions |
| Infrastructure | Docker, Kubernetes, kubectl |

---

# 📸 Screenshots

## 📊 Dashboard Overview

The central dashboard provides cluster health, workload statistics, operational insights, and live monitoring.

![Dashboard](screenshots/dashboard-overview.png)

---

## 🔐 Authenticated Viewer Session

The frontend validates the supplied API token against `/auth/me` before displaying the authenticated role.

```text
API Access ✓ · viewer
```

![RBAC Viewer Session](screenshots/rbac-viewer-session.png)

---

## 🔍 Global Search

Search Kubernetes resources across Pods, Deployments, Nodes, and Namespaces.

![Global Search](screenshots/global-search.png)

---

## ⌨️ Command Palette

Navigate the platform using keyboard shortcuts with **Ctrl+K / ⌘K**.

![Command Palette](screenshots/command-palette.png)

---

## 📈 Performance Analytics

Monitor CPU, memory, pod distribution, and namespace utilization using Prometheus-powered analytics.

![Performance Analytics](screenshots/performance-analytics.png)

---

## 🤖 AI Operations Summary

Review operational insights, health analysis, findings, incidents, and recommended actions.

![AI Operations Summary](screenshots/ai-operations-summary.png)

---

## 🚨 Incident Center

Track operational alerts and Kubernetes incidents from a centralized dashboard.

![Incident Center](screenshots/incident-center.png)

---

# 🌟 Project Overview

This infographic summarizes PlatformPilot's architecture, roadmap, repository highlights, and platform-engineering focus.

![PlatformPilot Overview](screenshots/platformpilot-overview.png)

---

# 📂 Project Structure

```text
platform-pilot/
│
├── backend/
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── routers/
│   │   ├── ai.py
│   │   ├── cloudops.py
│   │   └── metrics.py
│   │
│   ├── services/
│   ├── tests/
│   │   ├── test_rbac_routes.py
│   │   └── ...
│   │
│   ├── .env.example
│   ├── Dockerfile
│   ├── app.py
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApiAccess.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │
│   │   └── services/
│   │       ├── api.js
│   │       └── auth.js
│   │
│   ├── package.json
│   └── vite.config.js
│
├── infrastructure/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── monitoring-values-docker-desktop.yaml
│
├── docs/
├── screenshots/
│   ├── rbac-viewer-session.png
│   └── ...
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── pytest.ini
└── README.md
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/AZ1600/platform-pilot.git

cd platform-pilot
```

---

# 🐍 Backend

Create and activate a Python virtual environment:

```bash
python3 -m venv .venv

source .venv/bin/activate
```

Install backend dependencies:

```bash
python -m pip install -r backend/requirements.txt
```

For development and testing:

```bash
python -m pip install -r backend/requirements-dev.txt
```

Configure development credentials.

For example:

```bash
export PLATFORM_VIEWER_TOKEN="replace-with-viewer-token"
export PLATFORM_OPERATOR_TOKEN="replace-with-operator-token"
export PLATFORM_ADMIN_TOKEN="replace-with-admin-token"
```

Start the backend:

```bash
cd backend

uvicorn app:app --reload
```

Backend API:

```text
http://localhost:8000
```

Public health endpoint:

```text
http://localhost:8000/health
```

Authenticated principal endpoint:

```text
http://localhost:8000/auth/me
```

---

# 🔑 Backend Environment Configuration

A configuration template is available at:

```text
backend/.env.example
```

Example values:

```bash
PLATFORM_VIEWER_TOKEN=replace-with-viewer-token
PLATFORM_OPERATOR_TOKEN=replace-with-operator-token
PLATFORM_ADMIN_TOKEN=replace-with-admin-token

CLOUDOPS_INGEST_TOKEN=replace-with-cloudops-ingest-token
CLOUDOPS_FINDINGS_URL=http://127.0.0.1:3000/api/platform-pilot/findings

PLATFORM_ENVIRONMENT=local
KUBERNETES_CLUSTER_NAME=docker-desktop
```

Use long randomly generated values for real tokens.

Never commit production credentials to the repository.

---

# 🖥 Frontend

Install and run:

```bash
cd frontend

cp .env.example .env

npm install

npm run dev
```

The frontend uses:

```text
http://127.0.0.1:8000
```

by default.

To use a backend at a different address, configure:

```text
VITE_API_URL
```

inside:

```text
frontend/.env
```

Frontend:

```text
http://localhost:5173
```

---

# 🔐 Frontend Authentication

Once PlatformPilot is running:

1. Open the frontend.
2. Select **API Access**.
3. Enter a valid `viewer`, `operator`, or `admin` bearer token.
4. Select **Validate & Save**.
5. PlatformPilot validates the token against `/auth/me`.
6. The active role appears in the navigation.

Example:

```text
API Access ✓ · viewer
```

A rejected token is not stored as an authenticated session.

The bearer token is stored only for the current browser session.

---

# 🔎 API Authentication Examples

## Public Health

```bash
curl -i \
  http://127.0.0.1:8000/health
```

Expected:

```text
200 OK
```

---

## Authenticated Viewer

```bash
curl -i \
  -H "Authorization: Bearer $PLATFORM_VIEWER_TOKEN" \
  http://127.0.0.1:8000/auth/me
```

Expected response:

```json
{
  "authenticated": true,
  "role": "viewer"
}
```

---

## Viewer Authorization Boundary

```bash
curl -i \
  -X POST \
  -H "Authorization: Bearer $PLATFORM_VIEWER_TOKEN" \
  http://127.0.0.1:8000/cloudops/findings
```

Expected:

```text
403 Forbidden
```

---

## Operator Identity

```bash
curl -i \
  -H "Authorization: Bearer $PLATFORM_OPERATOR_TOKEN" \
  http://127.0.0.1:8000/auth/me
```

Expected:

```json
{
  "authenticated": true,
  "role": "operator"
}
```

---

# 🧪 Running Tests

From the repository root with the Python virtual environment active:

```bash
python -m pytest
```

Current validated baseline:

```text
44 passed
```

Frontend validation:

```bash
cd frontend

npm run lint
npm run build
```

Whitespace validation:

```bash
git diff --check
```

---

# 🔄 CI Pipeline

GitHub Actions validates both backend and frontend changes.

### Backend

```text
Install Python dependencies
        ↓
Run Pytest
```

### Frontend

```text
Install Node dependencies
        ↓
ESLint
        ↓
Production Vite build
```

The workflow uses read-only repository permissions and runs on pull requests and pushes to `main`.

---

# 🗺 Roadmap

## ✅ Completed

- Kubernetes Dashboard
- Kubernetes Resource Monitoring
- Cluster Health Scoring
- Prometheus Integration
- Performance Analytics
- Operational Summary
- Global Search
- Command Palette
- Incident Center
- Container Log Inspection
- PDF Export
- Auto Refresh
- Responsive UI
- CloudOps Operational Finding Export
- Authenticated CloudOps Delivery
- Role-Scoped API Authentication
- Viewer Read Access Boundary
- Operator and Admin Authorization Boundary
- Broader Endpoint RBAC
- Authenticated `/auth/me` Identity Endpoint
- Frontend Runtime Token Validation
- Session-Scoped Frontend API Access
- Backend Security Tests
- CI Validation
- Frontend Dependency Security Remediation
- Frontend Bundle Code Splitting

### 🚀 Future Extensions

- End-user authentication / SSO
- OIDC identity-provider integration
- Microsoft Entra ID integration
- Multi-cluster Support
- Historical Metrics
- WebSocket Live Updates
- Grafana Integration
- Helm Monitoring
- Expanded LLM-assisted Root Cause Analysis

---

# 💡 Use Cases

PlatformPilot helps Platform Engineers, DevOps Engineers, and SREs:

- monitor Kubernetes cluster health
- investigate unhealthy workloads
- search Kubernetes resources
- analyze Prometheus metrics
- detect operational incidents
- review container logs
- troubleshoot deployments
- generate structured operational findings
- enforce read vs operational permissions
- export incidents into controlled CloudOps workflows
- accelerate incident investigation and response

---

# 🔒 Security Notes

PlatformPilot follows a fail-closed approach for protected APIs.

No PlatformPilot authentication tokens are committed to source code.

Environment variables are used for:

```text
PLATFORM_VIEWER_TOKEN
PLATFORM_OPERATOR_TOKEN
PLATFORM_ADMIN_TOKEN
CLOUDOPS_INGEST_TOKEN
```

The role hierarchy is:

```text
viewer
   │
   ▼
operator
   │
   ▼
admin
```

Higher roles inherit the permissions of lower roles.

Public endpoints such as:

```text
/
GET /health
```

remain available without authentication for basic service discovery and health checking.

Protected API endpoints require a valid PlatformPilot bearer token.

Operational actions require the appropriate role.

The browser validates tokens through `/auth/me` before treating the session as authenticated.

The current bearer-token system is intentionally lightweight and suitable for the lab environment.

A future production identity implementation can replace the development token mechanism with OIDC or SSO while preserving the existing authorization model.

---

# 🤝 Contributing

Contributions are welcome.

Please read:

```text
CONTRIBUTING.md
```

before opening a pull request.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Olawale Azeez**

GitHub: https://github.com/AZ1600

---

<p align="center">

⭐ If you found PlatformPilot useful, please consider giving the repository a star!

</p>