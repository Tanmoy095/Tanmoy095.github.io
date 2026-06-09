---
title: "Kubernetes Resource Limits & Requests"
date: "2026-06-07"
category: "Kubernetes"
tags: ["Kubernetes", "DevOps", "Infrastructure"]
isADR: false
---

Understanding scheduler placement behaviors, resource limits enforcement, cgroups, and pod eviction mechanisms under load.

### Key Learnings:
- **Requests:** Used by the scheduler to place Pods on Nodes. If a Node has enough allocatable CPU/Memory to satisfy requests, the Pod is scheduled.
- **Limits:** Enforced at runtime by the container runtime via Linux kernel `cgroups`.
- **CPU Throttling:** If a container exceeds its CPU limit, it is throttled by the kernel using CPU shares. It does not crash.
- **OOM Killing:** If a container exceeds its Memory limit, it is terminated with exit code 137 (Out Of Memory).
- **QoS Classes:**
  - *Guaranteed:* Requests equal limits for both CPU and memory. Least likely to be evicted.
  - *Burstable:* Requests are set and are less than limits. Medium eviction priority.
  - *BestEffort:* No requests or limits set. First to be evicted under resource pressure.
- **Overcommit:** Kubernetes allows overcommitting nodes (sum of limits > node size). This is cost-efficient but requires careful monitoring to prevent cascading failures.
