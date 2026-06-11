---
title: "Event-Driven Architecture (HLD): Saga Pattern, Outbox Pattern & CQRS"
description: "A deep dive into Event-Driven Architecture (EDA) for high-scale distributed systems. Learn how to implement Saga workflows, the Transactional Outbox pattern, and CQRS."
pubDate: "2026-06-08"
author: "Aunmoy Dey Tanmoy"
tags: ["System Design", "Distributed Systems", "EDA", "Kafka"]
image: "/blog-assets/event-driven-architecture-hld.svg"
---

# Event-Driven Architecture (EDA) at Scale

In modern cloud systems, building highly available, decoupled, and horizontally scalable microservices is the standard. Traditional synchronous communication (REST/gRPC) is simple but creates strong coupling. If Service A calls Service B synchronously, and Service B is down, Service A fails too. 

**Event-Driven Architecture (EDA)** solves this temporal coupling by introducing an asynchronous message broker (like Apache Kafka or RabbitMQ) between services. Instead of calling each other directly, services emit **Events**—immutable records of things that have happened in the past (e.g., `OrderCreated`, `PaymentAuthorized`).

---

## Core Patterns in Event-Driven Systems

To build resilient and consistent event-driven systems, senior engineers rely on several critical patterns.

### 1. Transactional Outbox Pattern

#### The Problem: Dual Write Inconsistency
When a service processes a business request, it often needs to do two things:
1. Update its local database (e.g., save an order in the Orders DB).
2. Publish an event to a message broker (e.g., send `OrderCreated` to Kafka).

If the database write succeeds but the message broker publish fails, the system enters an inconsistent state. If you try to reverse the order, the publish succeeds but the database write fails—leaving downstream services reacting to an event that never existed in the source database.

#### The Solution: The Outbox Table
Instead of publishing the event directly during the HTTP request, you save both the entity change and the event payload into the **same database** inside a single database transaction. The event is written to a special `outbox` table.

Because this write is atomic (all-or-nothing), you guarantee that if the order is saved, the outbox record is also saved.

An asynchronous process (like Debezium for Change Data Capture (CDC), or a polling worker) reads the `outbox` table, publishes the event to Kafka, and marks the outbox record as processed.

```sql
-- Transactional Outbox Schema
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE outbox (
    id UUID PRIMARY KEY,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Outbox Publisher in Go
```go
package outbox

import (
    "context"
    "database/sql"
    "encoding/json"
    "github.com/google/uuid"
)

type Order struct {
    ID         uuid.UUID
    CustomerID uuid.UUID
    Total      float64
    Status     string
}

func CreateOrderTx(ctx context.Context, db *sql.DB, order *Order) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // 1. Insert order
    _, err = tx.ExecContext(ctx, 
        "INSERT INTO orders (id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4)",
        order.ID, order.CustomerID, order.Total, order.Status,
    )
    if err != nil {
        return err
    }

    // 2. Prepare Outbox Event
    payload, err := json.Marshal(order)
    if err != nil {
        return err
    }

    _, err = tx.ExecContext(ctx,
        "INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, $2, $3, $4, $5)",
        uuid.New(), "Order", order.ID.String(), "OrderCreated", payload,
    )
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

---

### 2. Saga Pattern (Distributed Transactions)

In microservices, databases are split by service. We cannot use standard ACID transactions across multiple databases. If a user places an order, we need to:
1. Reserve inventory (Inventory Service)
2. Charge credit card (Payment Service)
3. Ship goods (Shipment Service)

If payment fails after inventory is reserved, we must release the inventory. 

A **Saga** is a sequence of local transactions. For every local transaction that executes, the Saga coordinator tracks progress. If a step fails, the Saga runs **compensating transactions** in reverse order to undo the changes.

#### Choreography vs. Orchestration
- **Choreography:** Services emit events and listen to other services' events independently. Simple to set up but difficult to trace and debug as the system grows.
- **Orchestration:** A central coordinator service (often built with workflow tools like **Temporal**) explicitly orchestrates the steps, handles retries, and triggers compensations. This is the preferred approach for complex business workflows (such as billing or fulfillment).

```
[Orchestrator] ──(Reserve Inventory)──> [Inventory Service]
[Orchestrator] <──(Inventory Reserved)── [Inventory Service]
[Orchestrator] ──(Process Payment)──>   [Payment Service] (FAILS!)
[Orchestrator] ──(Release Inventory)──> [Inventory Service] (COMPENSATION)
```

---

### 3. CQRS (Command Query Responsibility Segregation)

In highly concurrent systems, the write path (commands) and the read path (queries) have different performance and scaling requirements.
- **Writes** require complex validation, consistency checks, and transaction boundaries.
- **Reads** require fast aggregation, filtering, search, and denormalized views.

**CQRS** separates the write model from the read model:
- The **Write DB** (PostgreSQL/MySQL) processes commands.
- Whenever writes happen, an event is emitted.
- An event consumer project processes this event and updates the **Read DB** (Elasticsearch, Redis, or denormalized Postgres tables).
- Queries are served directly from the Read DB, making read APIs extremely fast.

---

## Core Messaging Brokers: Kafka vs. RabbitMQ

When building EDA systems, picking the right messaging broker is vital:

| Feature | Apache Kafka | RabbitMQ |
| :--- | :--- | :--- |
| **Model** | Log-based (Pull model) | Message queue (Push model) |
| **Ordering** | Guaranteed per partition | Guaranteed only within a queue |
| **Persistence** | Durable log (replays allowed) | Ephemeral queues (deleted after ack) |
| **Scale** | Multi-million messages/sec (High throughput) | Hundreds of thousands/sec |
| **Best Used For** | Stream processing, event logs, analytics | Routing, work queues, tasks |

---

## Best Practices for Event-Driven Systems

1. **Idempotency is Mandatory:** Message delivery is usually "at-least-once". Consumers will receive duplicate events due to network retries. Ensure your database updates use deduplication keys or `UPSERT` semantics.
2. **Schema Registry:** Use Avro or Protobuf schemas and maintain a schema registry. This prevents breaking changes when event formats change.
3. **Dead-Letter Queues (DLQ):** If a consumer fails to process a message due to a bad payload (poison pill), do not block the queue. Route the message to a DLQ for offline debugging and alerts.
4. **Distributed Tracing:** Implement OpenTelemetry to inject trace IDs into event headers. This allows you to trace a single transaction as it propagates asynchronously across multiple services and message brokers.
