---
title: "Kafka Partition Rebalancing"
date: "2026-06-09"
category: "Distributed Systems"
tags: ["Kafka", "Distributed Systems", "Scaling"]
isADR: false
---

Deep dive into consumer groups and rebalancing strategies to optimize messaging performance and throughput in large-scale event-driven systems.

### Key Learnings:
- **Group Coordinator:** A broker responsible for managing consumer group state and assigning partitions.
- **Stop-The-World Rebalancing:** The traditional eager rebalance protocol revokes all partitions and pauses message processing during rebalance, which can cause latency spikes.
- **Cooperative Sticky Assignor:** Introduced to allow consumers to keep their partitions while other partitions are reassigned, reducing downtime during scaling.
- **Tuning timeouts:** Keep `session.timeout.ms` and `max.poll.interval.ms` properly adjusted to prevent false consumer failures.
- **Rebalance Listeners:** Implement custom logic on partitions revoked and assigned to flush database changes or commit offsets before partition ownership shifts.
