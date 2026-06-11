---
title: "Why Use a Buffered Channel? Worker Pools & Batch Aggregation in Go"
description: "A deep dive into Go's buffered channels, showing how worker pools, backpressure, and atomic database flushes are implemented in production."
pubDate: "2026-06-10"
author: "Aunmoy Dey Tanmoy"
tags: ['Go', 'Concurrency', 'Worker Pool', 'Billing Systems']
image: "/blog-assets/why-use-buffered-channels-go.jpg"
---

Why Use a Buffered Channel: eventChan: make(chan UsageEvent, 1000)
In Go, channels are a way for goroutines (lightweight threads) to communicate safely without shared memory issues like races. A buffered channel is a special type of channel that has an internal queue (buffer) to hold a fixed number of items before blocking.
Simple Explanation
- Unbuffered channel (e.g., make(chan UsageEvent) with no size): Like a direct handoff—sender blocks (waits) until a receiver takes the item. If no receiver ready, everything pauses.
- Buffered channel (e.g., make(chan UsageEvent, 1000)): Like a queue with 1000 slots. Sender adds items quickly as long as space exists; only blocks if full. Receivers (workers) pull from it independently.
Why Buffered Here?
- Handle Bursts of Events: In a billing system, usage events (e.g., API calls) might come in sudden spikes (e.g., 5000 events in 1 second during peak traffic). A buffer absorbs this without slowing the sender (e.g., Kafka consumer calling Ingest). Without buffer, Ingest would block immediately if workers are busy—causing upstream delays or failures.
- Decouple Producer and Consumers:
- Producer: Code calling Ingest (e.g., event source).
- Consumers: Workers pulling from channel.
- Buffer lets producer add events fast, even if workers temporarily lag (e.g., during high load or network hiccups). This prevents the whole system from stalling.
- Backpressure Management: If buffer fills (1000 events queued), Ingest drops extras (logs warning). This is "backpressure"—signals overload. In prod, replace drop with retry or dead-letter queue (DLQ) to avoid data loss.
- Performance: Buffers reduce context switches (goroutines waking/sleeping). Size 1000 is a balance: Too small (e.g., 10) → frequent blocks; too large (e.g., 1M) → high memory use.
Real Example
- Imagine 2000 events arrive at once (Black Friday rush).
- With buffer=1000: First 1000 queue instantly; next 1000 drop/log (fix in prod).
- Workers (e.g., 5) process queued ones in parallel.
- Without buffer: Each Ingest waits for a worker—system slows to worker speed (e.g., 5 EPS), dropping most events upstream.
In tests, this prevents flakiness; in prod, monitors buffer usage (e.g., via metrics) to scale workers.
Explaining the Worker Start Loop: for i := 0; i < workers; i++ { agg.wg.Add(1); go agg.worker(i); }
This loop launches the worker pool. It creates workers number of goroutines, each running the worker function, and tracks them with a WaitGroup (wg) for clean shutdown.
Simple Explanation
- Loop: Runs workers times (e.g., if workers=5, loop 0 to 4).
- wg.Add(1): Tells WaitGroup "one more task starting"—increments counter.
- go agg.worker(i): Starts a new goroutine running worker(i). The go keyword makes it concurrent (parallel).
- i is just an ID (e.g., worker 0,1,2...) for logging/debugging.
Why wg.Add(1)?
- WaitGroup (sync.WaitGroup) coordinates goroutines: Tracks how many are running.
- Add(1): Before starting each goroutine, increment wg counter (e.g., from 0 to 5 for 5 workers).
- In worker, defer wg.Done() decrements it when finished.
- Why? Ensures agg.Stop() (which calls wg.Wait()) blocks until all workers exit—no premature app shutdown with unfinished work.
- Without Add(1), wg.Wait() wouldn't track properly—potential goroutine leaks or data loss.
What Does agg.worker(i) Mean?
- agg.worker(i): Calls the worker method on Aggregator, passing i (ID).
- go makes it a goroutine—runs independently, in parallel.
- ID i: Optional—helps debug (e.g., log "Worker 3 processed event"). Not critical, but useful.
If You Set workers=500 (What Happens / Can't Understand)
- What happens: Loop runs 500 times → 500 goroutines start, each in its worker loop.
- Each idles, waiting for events (low CPU until work arrives).
- On events: Up to 500 process in parallel (if CPU allows)—great for high load (e.g., 10k EPS).
- Pros: Massive parallelism—scales with CPU cores (e.g., on a 64-core server, handles huge throughput).
- Cons / Why Careful:
- Resource use: 500 goroutines are cheap in Go (few KB each), but if each holds resources (e.g., DB connections later), could overwhelm (e.g., 500 DB queries at once).
- Contention: More workers → more competition for locks (e.g., bucket mutex)—potential slowdown if all hit same bucket.
- When too many: If > CPU cores (e.g., 500 on 8-core machine), context switching overhead—thrashing. Tune based on benchmarks (e.g., start with runtime.NumCPU() * 2).
- In practice: For 500, fine if machine powerful; monitor CPU/memory. If overload, reduce or add machines (horizontal scale).
Real Example

```go

agg.Start(500): Launches 500 workers.
1000 events ingested: Distributed across 500 (some idle, others busy).
```

- Shutdown: wg.Wait() ensures all 500 call Done() before proceeding.
- If no Add(1): Shutdown might happen before workers start—bugs.
This design makes the system scalable and robust—key for billing reliability. If still unclear, think of workers as restaurant servers: Add(1) registers them; go starts them working; wg.Wait() waits for shift end.
| Term        | Meaning                              | Why Important in Billing             | Example                               |
| ----------- | ------------------------------------ | ------------------------------------ | ------------------------------------- |
| Flush       | Save memory data to DB               | Prevent data loss on crash           | Memory 150 → DB +150 → memory reset   |
| Batch       | Group many saves together            | Faster, fewer DB calls               | 500 records in 1 write instead of 500 |
| FlushBatch  | Batch + unique ID                    | Enable idempotency                   | {BatchID: "abc", Records: [...]}      |
| Dedup       | Remove duplicates                    | Prevent double counting              | Same event twice → count only once    |
| Idempotency | Retry-safe (same result if repeated) | Safe retries without overcharging    | Retry flush → no extra charge         |
| Atomic Save | All-or-nothing (transaction)         | No partial/corrupted data on failure | 300 records or 0 — never 150          |
Now you understand the core ideas behind making usage aggregation durable, correct, and safe—this is exactly what senior engineers design for financial systems. These concepts prevent real money bugs!

