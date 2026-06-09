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
Unbuffered channel (e.g., make(chan UsageEvent) with no size): Like a direct handoff—sender blocks (waits) until a receiver takes the item. If no receiver ready, everything pauses.
Buffered channel (e.g., make(chan UsageEvent, 1000)): Like a queue with 1000 slots. Sender adds items quickly as long as space exists; only blocks if full. Receivers (workers) pull from it independently.
Why Buffered Here?
Handle Bursts of Events: In a billing system, usage events (e.g., API calls) might come in sudden spikes (e.g., 5000 events in 1 second during peak traffic). A buffer absorbs this without slowing the sender (e.g., Kafka consumer calling Ingest). Without buffer, Ingest would block immediately if workers are busy—causing upstream delays or failures.
Decouple Producer and Consumers:
Producer: Code calling Ingest (e.g., event source).
Consumers: Workers pulling from channel.
Buffer lets producer add events fast, even if workers temporarily lag (e.g., during high load or network hiccups). This prevents the whole system from stalling.
Backpressure Management: If buffer fills (1000 events queued), Ingest drops extras (logs warning). This is "backpressure"—signals overload. In prod, replace drop with retry or dead-letter queue (DLQ) to avoid data loss.
Performance: Buffers reduce context switches (goroutines waking/sleeping). Size 1000 is a balance: Too small (e.g., 10) → frequent blocks; too large (e.g., 1M) → high memory use.
Real Example
Imagine 2000 events arrive at once (Black Friday rush).
With buffer=1000: First 1000 queue instantly; next 1000 drop/log (fix in prod).
Workers (e.g., 5) process queued ones in parallel.
Without buffer: Each Ingest waits for a worker—system slows to worker speed (e.g., 5 EPS), dropping most events upstream.
In tests, this prevents flakiness; in prod, monitors buffer usage (e.g., via metrics) to scale workers.
Explaining the Worker Start Loop: for i := 0; i < workers; i++ { agg.wg.Add(1); go agg.worker(i); }
This loop launches the worker pool. It creates workers number of goroutines, each running the worker function, and tracks them with a WaitGroup (wg) for clean shutdown.
Simple Explanation
Loop: Runs workers times (e.g., if workers=5, loop 0 to 4).
wg.Add(1): Tells WaitGroup "one more task starting"—increments counter.
go agg.worker(i): Starts a new goroutine running worker(i). The go keyword makes it concurrent (parallel).
i is just an ID (e.g., worker 0,1,2...) for logging/debugging.
Why wg.Add(1)?
WaitGroup (sync.WaitGroup) coordinates goroutines: Tracks how many are running.
Add(1): Before starting each goroutine, increment wg counter (e.g., from 0 to 5 for 5 workers).
In worker, defer wg.Done() decrements it when finished.
Why? Ensures agg.Stop() (which calls wg.Wait()) blocks until all workers exit—no premature app shutdown with unfinished work.
Without Add(1), wg.Wait() wouldn't track properly—potential goroutine leaks or data loss.
What Does agg.worker(i) Mean?
agg.worker(i): Calls the worker method on Aggregator, passing i (ID).
go makes it a goroutine—runs independently, in parallel.
ID i: Optional—helps debug (e.g., log "Worker 3 processed event"). Not critical, but useful.
If You Set workers=500 (What Happens / Can't Understand)
What happens: Loop runs 500 times → 500 goroutines start, each in its worker loop.
Each idles, waiting for events (low CPU until work arrives).
On events: Up to 500 process in parallel (if CPU allows)—great for high load (e.g., 10k EPS).
Pros: Massive parallelism—scales with CPU cores (e.g., on a 64-core server, handles huge throughput).
Cons / Why Careful:
Resource use: 500 goroutines are cheap in Go (few KB each), but if each holds resources (e.g., DB connections later), could overwhelm (e.g., 500 DB queries at once).
Contention: More workers → more competition for locks (e.g., bucket mutex)—potential slowdown if all hit same bucket.
When too many: If > CPU cores (e.g., 500 on 8-core machine), context switching overhead—thrashing. Tune based on benchmarks (e.g., start with runtime.NumCPU() * 2).
In practice: For 500, fine if machine powerful; monitor CPU/memory. If overload, reduce or add machines (horizontal scale).
Real Example

```go

agg.Start(500): Launches 500 workers.
1000 events ingested: Distributed across 500 (some idle, others busy).
```

Shutdown: wg.Wait() ensures all 500 call Done() before proceeding.
If no Add(1): Shutdown might happen before workers start—bugs.
This design makes the system scalable and robust—key for billing reliability. If still unclear, think of workers as restaurant servers: Add(1) registers them; go starts them working; wg.Wait() waits for shift end.
Simple & Clear Explanation of All Terms (With Real Billing Examples)
These terms come from Phase 2.1 (persistent usage aggregation). I'll explain each one like I'm teaching a friend—simple language, real examples from our billing system (tracking API calls/shipments per customer).

## 1. Flush – What does it mean?

Flush = "Save the in-memory data to the database now."
In our system: Usage events are first counted quickly in memory (fast Buckets map).
Memory is temporary—if the server crashes, data is lost.
Flush means: Take the current counts/deltas from memory and write them permanently to PostgreSQL table (usage_aggregates).
Example:
In memory: Customer ABC has 150 new API calls since last save.
When we flush: We add +150 to the DB row for ABC → API_REQUEST → December 2025.
After flush, memory delta resets to 0 (so next flush only adds new ones).
Why call it "flush"? Like flushing a toilet—push everything out to make space and make it permanent.

## 2. Batch – What is it?

Batch = A group of many changes saved together in one go.
Instead of saving one event at a time (slow and expensive), we collect many and save them all at once.
Example:
100 customers each have new usage (total 500 records).
Without batch: 500 separate DB writes → very slow.
With batch: 1 DB write with all 500 records → fast and efficient.
In our code: []UsageRecord or FlushBatch.Records is the batch (list of changes).

## 3. FlushBatch – What is this struct?

FlushBatch is our custom wrapper that holds:
A unique ID (BatchID – UUID)
The list of records to save (Records []UsageRecord)
Go

```go

type FlushBatch struct {
```

    BatchID uuid.UUID      // Unique ID for this flush
    Records []UsageRecord  // The actual data to save
}
Why do we need FlushBatch? To make flushing idempotent (see below). The BatchID acts like a "receipt number"—we can check if this exact batch was already saved.
Example:
FlushBatch ID: "flush-abc123"
Contains 200 usage records
We try to save it
If network fails and we retry → system sees "flush-abc123" already done → skips (no double add)

## 4. Dedup (De-duplication) – What does it mean?

Dedup = Remove duplicates so something is counted only once.
Two levels in our system:
Event-level dedup: Each UsageEvent has an ID (idempotency key). If same event arrives twice (e.g., Kafka retry), we skip it.
Flush-level dedup: Using BatchID in FlushBatch—if same batch retried, skip.
Example:
Same event "API call #567" arrives twice → dedup skips second → not counted twice.
Same flush batch retried → dedup skips → no double-add to monthly total.

## 5. Idempotency – The Most Important Concept

Idempotency = "You can do the same operation many times, but the result is the same as doing it once."
Safe to retry without side effects (no double charging!).
Why critical in billing?
Networks fail → we retry operations.
Without idempotency → retry = double count = overcharge customer = disaster.
Examples in our system:
Idempotent event ingest: Same event ID twice → counted only once.
Idempotent flush: Same FlushBatch (same BatchID) twice → DB updated only once.
DB UPSERT: INSERT ... ON CONFLICT DO UPDATE is idempotent.
Real example:
Flush adds +100 API calls for ABC.
Network fails → code retries same FlushBatch.
Because of BatchID + idempotency → only +100 total, not +200.

## 6. Atomic Save – What does it mean?

Atomic = "All or nothing." Either the whole operation succeeds, or nothing changes.
In databases: Done using transactions.
Example:
FlushBatch has 300 records.
We start a DB transaction:
BEGIN
UPSERT record 1
UPSERT record 2
...
UPSERT record 300
COMMIT
If crash at record 150 → transaction rolls back → zero records saved.
No partial state → no wrong totals.
Why atomic is crucial:
Prevents corrupted data (e.g., only half the batch saved).
Makes crashes safe.
Summary Table (Easy to Remember)
Term
Meaning
Why Important in Billing
Example
Flush
Save memory data to DB
Prevent data loss on crash
Memory 150 → DB +150 → memory reset
Batch
Group many saves together
Faster, fewer DB calls
500 records in 1 write instead of 500
FlushBatch
Batch + unique ID
Enable idempotency
{BatchID: "abc", Records: [...]}
Dedup
Remove duplicates
Prevent double counting
Same event twice → count only once
Idempotency
Retry-safe (same result if repeated)
Safe retries without overcharging
Retry flush → no extra charge
Atomic Save
All-or-nothing (transaction)
No partial/corrupted data on failure
300 records or 0 — never 150
Now you understand the core ideas behind making usage aggregation durable, correct, and safe—this is exactly what senior engineers design for financial systems. These concepts prevent real money bugs!

