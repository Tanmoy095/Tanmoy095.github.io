---
title: "ADR-001: Microservices over Monolith"
date: "2026-06-05"
category: "ADR"
tags: ["Architecture", "ADR", "Microservices"]
isADR: true
adrStatus: "Accepted"
---

### Context
Our core platform needs to scale horizontally to support millions of concurrent connections, isolate high-load components (like ML inference serving and real-time streaming), and enable multiple teams to deploy their services independently without coordination blockages.

### Decision
We will adopt a Microservices Architecture instead of a unified monolith. Each service will be responsible for a single domain (e.g., Shipment, Routing, Authentication, Billing), have its own database to ensure loose coupling, and run in isolated containers.

### Consequences
- **Pros:**
  - Independent scaling of resource-heavy services (e.g. ML inference requires GPUs, auth requires memory-focused DB caching).
  - Isolated failure domains; a crash in route calculation does not bring down billing or user login.
  - Team autonomy and faster development cycles.
- **Cons:**
  - Increased network hop latency.
  - Higher operational overhead (monitoring, distributed tracing, Kubernetes configuration).
  - Complex transaction management (requires patterns like Saga or Outbox instead of local ACID transactions).
