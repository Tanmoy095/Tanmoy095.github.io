---
title: "gRPC Performance Optimization"
date: "2026-06-08"
category: "Go"
tags: ["gRPC", "Go", "Performance"]
isADR: false
---

Benchmarking and tuning gRPC services for high-throughput, low-latency microservices communication.

### Key Learnings:
- **HTTP/2 Multiplexing:** Enables sending multiple requests and responses concurrently over a single TCP connection, reducing handshake overhead by 80%+.
- **Protocol Buffers:** Binary encoding is 3-10x faster to serialize/deserialize than JSON and has a much smaller payload footprint.
- **Connection Pooling:** In Go, client connections should be shared or pooled across goroutines to prevent active TCP connection thrashing.
- **Keepalive Pings:** Setting up client-side and server-side keepalive parameters keeps connections warm and quickly catches dead TCP sockets.
- **Message Compression:** Gzip/Snappy compression reduces network bandwidth but trades CPU cycles. Only compress larger payloads (>100KB).
