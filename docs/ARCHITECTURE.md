# PlatformPilot Architecture

## Overview

PlatformPilot is a full-stack platform engineering dashboard.

```
React Dashboard
        │
        ▼
FastAPI Backend
        │
        ▼
Kubernetes API
        │
        ▼
Cluster Resources
```

---

## Backend

Responsible for:

- Reading Kubernetes resources
- Detecting infrastructure risks
- Collecting logs
- Collecting Kubernetes events
- Producing AI recommendations

---

## Frontend

Responsible for:

- Displaying dashboard metrics
- Showing incidents
- Navigating cluster resources
- Visualizing AI analysis

---

## Future Integrations

- Prometheus
- AWS
- Terraform
- Argo CD
- GitHub