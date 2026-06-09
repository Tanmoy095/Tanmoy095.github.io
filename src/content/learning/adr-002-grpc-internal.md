---
title: "ADR-002: gRPC for Internal Communication"
date: "2026-06-06"
category: "ADR"
tags: ["Architecture", "ADR", "gRPC"]
isADR: true
adrStatus: "Accepted"
---

### Context
In a microservices architecture, services make frequent RPC calls to fetch lookup values, verify auth states, and trigger downstream processes. Using standard REST/JSON creates performance bottlenecks due to string serialization, lacks strict typing interfaces, and does not support streaming naturally.

### Decision
We will use **gRPC** with **Protocol Buffers** for all synchronous, internal service-to-service communication. External traffic from users will still enter through HTTP/JSON or GraphQL via our API Gateway, which will translate incoming payloads to internal gRPC requests.

### Consequences
- **Pros:**
  - Highly optimized serialization and deserialization speeds.
  - Multi-language support with automatic code generation from `.proto` definition files.
  - Strongly typed communication contracts checked at compile-time.
  - Out-of-the-box support for client, server, and bidirectional streaming.
- **Cons:**
  - Human readability is reduced compared to JSON (requires tools like `grpcurl` or UI debuggers like Postman/BloomRPC).
  - Requires maintaining a schema definition workflow (e.g. shared repo or registry) to prevent breaking API contracts.
