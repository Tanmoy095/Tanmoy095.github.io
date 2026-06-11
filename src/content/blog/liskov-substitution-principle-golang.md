---
title: "Liskov Substitution Principle (LSP) in Go & Distributed Systems"
description: "How the Liskov Substitution Principle translates to Go's implicit interfaces and distributed architectures, ensuring behavioral contracts aren't broken."
pubDate: "2026-06-06"
author: "Aunmoy Dey Tanmoy"
tags: ['Go', 'SOLID', 'Distributed Systems', 'Clean Code']
image: "/blog-assets/liskov-substitution-principle-golang.svg"
---

# Liskov Substitution Principle (LSP) in Go Lang

Liskov Substitution Principle (LSP)

In traditional object-oriented languages (like Java or C++), LSP is all about inheritance: "Derived classes must be substitutable for their base classes."
But Go does not have inheritance. There is no extends keyword. Instead, Go relies entirely on composition and Implicit Interfaces. Therefore, in Golang, LSP means one thing: Honoring the Behavioral Contract.
When a High Level module depends on a Go Interface, It expects on some behaviors Guarantees and Invariants. If an implementation satisfied thew structural signature of the interface but does not satisfy or violates the underlying Semantic promises you have broken LSPThe Ultimate Litmus Test for an LSP ViolationIf you ever see code that looks like this inside your core business logic, LSP is dead:
package main
//This interface is too broad: it forces every store to implement Save,FindByID, and Delete. Postgres can do all three (✅).
//But Redis cannot delete shipments (❌). But since Go requires all methods, Redis must implement Delete anyway. 


```go

type ShipmentStore interface {

    Save(id string, payload []byte) error
    FindByID(id string) ([]byte, error)
    Delete(id string) error
}

// Postgres supports full CRUD


type PostgresStore struct{}

func (p *PostgresStore) Save(id string, payload []byte) error {
    fmt.Println("Postgres: saving shipment", id)
    return nil
}


func (p *PostgresStore) FindByID(id string) ([]byte, error) {
    return []byte("Postgres data for " + id), nil
}


func (p *PostgresStore) Delete(id string) error {
    fmt.Println("Postgres: deleting shipment", id)
    return nil
}
```




// Redis cannot delete shipments

```go

type RedisStore struct{}

func (r *RedisStore) Save(id string, payload []byte) error {
    fmt.Println("Redis: caching shipment", id)
    return nil
}


func (r *RedisStore) FindByID(id string) ([]byte, error) {
    return []byte("Redis cached data for " + id), nil
}
```

//Redis pretends to support Delete, but really it doesn’t.
//This breaks the (LSP):the caller expects Delete to work, but Redis violates the promise. 

```go

func (r *RedisStore) Delete(id string) error {
    return errors.New("operation not supported: Redis cannot delete")
}
```


// Service depending on abstraction

```go

type ShipmentService struct {
    store ShipmentStore
}


func (s *ShipmentService) RemoveShipment(id string) {
 //❌ Architectural crime: special-case handling .Service Must check using type 
//That means the abstraction (ShipmentStore) is useless — the caller isn’t blind anymore.
//Every new store type (Mongo, Cloud, etc.) would force changes here.
//This is why it’s called an architectural crime: business logic is now tightly coupled to infrastructure details.
    switch impl := s.store.(type) {
    case *PostgresStore:
        impl.Delete(id)
    case *RedisStore:
        fmt.Println("Redis cannot delete shipments, skipping...")
    }

}


We split responsibilities so each store only promises what it can actually do
Step 1: Define Contracts (Interfaces). 
// Core contracts


type ShipmentReader interface {

    FindByID(id string) ([]byte, error)
}



type ShipmentWriter interface {

    Save(id string, payload []byte) error
}



type ShipmentDeleter interface {

    Delete(id string) error
}

// Full-featured store (CRUD)
Type ShipmentStore interface {
     ShipmentReader
     ShipmentWriter
     ShipmentDeleter
}

Reader → for read-only stores (like cache).
Writer → for stores that can persist shipments.
Deleter → for stores that can remove shipments.
ShipmentStore → full CRUD (Postgres, Mongo, etc.).
🗄️ Step 2: Implementations:
Postgres (full CRUD)
go


type PostgresStore struct{}

func (p *PostgresStore) Save(id string, payload []byte) error {
    fmt.Println("Postgres: saving shipment", id)
    return nil
}


func (p *PostgresStore) FindByID(id string) ([]byte, error) {
    return []byte("Postgres data for " + id), nil
}


func (p *PostgresStore) Delete(id string) error {
    fmt.Println("Postgres: deleting shipment", id)
    return nil
}

Redis (read + write, but no delete)


type RedisStore struct{}

func (r *RedisStore) Save(id string, payload []byte) error {
    fmt.Println("Redis: caching shipment", id)
    return nil
}


func (r *RedisStore) FindByID(id string) ([]byte, error) {
    return []byte("Redis cached data for " + id), nil
}

Cloud Storage (read + write, delete optional): Cloud supports full CRUD (like S3/Blob)


type CloudStore struct{}

func (c *CloudStore) Save(id string, payload []byte) error {
    fmt.Println("Cloud: uploading shipment", id)
    return nil
}


func (c *CloudStore) FindByID(id string) ([]byte, error) {
    return []byte("Cloud data for " + id), nil
}


func (c *CloudStore) Delete(id string) error {
    fmt.Println("Cloud: deleting shipment", id)
    return nil
}
```


⚙️ Step 3: Services Depending on Abstractions: Business service that needs full CRUD
// ShipmentService orchestrates DB + Cache

```go

type ShipmentService struct {
    store ShipmentStore   // durable DB (Postgres/Cloud)
    cache ShipmentReader  // fast cache (Redis)
}


func (s *ShipmentService) CreateShipment(id string, payload []byte) {
    // Save to DB
    s.store.Save(id, payload)
    // Save to cache if supported
    if writer, ok := s.cache.(ShipmentWriter); ok {
        writer.Save(id, payload)
    }

}



func (s *ShipmentService) GetShipment(id string) ([]byte, error) {
    // Try cache first
    data, err := s.cache.FindByID(id)
    if err == nil && len(data) > 0 {
        fmt.Println("Cache hit")
        return data, nil
    }

    // Fallback to DB
    fmt.Println("Cache miss, hitting DB")
    data, err = s.store.FindByID(id)
    if err != nil {
        return nil, err
    }

    // Update cache for next time
    if writer, ok := s.cache.(ShipmentWriter); ok {
        writer.Save(id, data)
    }
    return data, nil
}
//Evist Redis so that Stale Data Isnt Served.


func (s *ShipmentService) RemoveShipment(id string) {
    s.store.Delete(id)
    if deleter, ok := s.cache.(ShipmentDeleter); ok {
        deleter.Delete(id)
    }

}






 Reporting service only needs reads


type ReportingService struct {
    db    ShipmentReader   // durable source (Postgres/Cloud)
    cache ShipmentReader   // fast cache (Redis)
}


func (r *ReportingService) GenerateReport(id string) {
    // Try cache first
    data, err := r.cache.FindByID(id)
    if err == nil && len(data) > 0 {
        fmt.Println("Report (cache hit):", string(data))
        return
    }

    // Fallback to DB
    fmt.Println("Cache miss, hitting DB")
    data, err = r.db.FindByID(id)
    if err != nil {
        fmt.Println("Error fetching from DB:", err)
        return
    }

    // Update cache for next time
    if writer, ok := r.cache.(ShipmentWriter); ok {
        writer.Save(id, data)
    }

    fmt.Println("Report (from DB):", string(data))
}
Step 4: Main program


func main() {
    postgres := &PostgresStore{}
    redis := &RedisStore{}
    cloud := &CloudStore{}

    // ShipmentService with Postgres + Redis
    shipmentService := ShipmentService{store: postgres, cache: redis}
    shipmentService.CreateShipment("SHIP-123", []byte("payload"))
    shipmentService.GetShipment("SHIP-123")
    shipmentService.RemoveShipment("SHIP-123")

    // Reporting service with Redis only
    reporting := ReportingService{reader: redis, db: postgres
}

    reporting.GenerateReport("SHIP-456")

    // ShipmentService with Cloud + Redis
    shipmentService2 := ShipmentService{store: cloud, cache: redis}
    shipmentService2.CreateShipment("SHIP-789", []byte("payload"))
    shipmentService2.GetShipment("SHIP-789")
    shipmentService2.RemoveShipment("SHIP-789")
}

In the context of our shipment example, the first design violated LSP because Redis was forced to implement a Delete method even though it cannot truly support deletion in the same way a database does. That meant the abstraction (ShipmentStore) was lying: the caller expected deletion to work, but substituting Redis broke the promise. This led to specialcase handling in the service layer, which is exactly what LSP warns against — the client should not need to check “is this Postgres or Redis?” to decide how to behave.
By splitting responsibilities into smaller, capabilitybased interfaces (ShipmentReader, ShipmentWriter, ShipmentDeleter), each store only promises what it can actually do. Postgres and Cloud implement full CRUD, Redis implements only read and write, and services depend only on the capabilities they truly need. This way, Redis can be safely substituted wherever a Reader or Writer is expected, and Postgres or Cloud can be substituted wherever full CRUD is required. No fake methods, no broken promises, no typeswitch hacks — just clean abstractions.
The theoretical takeaway is that LSP ensures substitutability without surprises. If a service depends on an abstraction, any implementation of that abstraction should behave consistently with the contract. Violating LSP forces the client to handle special cases and undermines the whole point of abstraction. Respecting LSP, as we did in the final design, keeps business logic decoupled from infrastructure details, makes the system easier to extend, and ensures that swapping one store for another does not break correctness


```

# LSP in Distributed Systems & Microservices

Liskov Substitution Principle (LSP) in Distributed Shipment Systems
The Liskov Substitution Principle (LSP) is the L in SOLID.It says:
Objects of a superclass should be replaceable with objects of its subclasses without affecting the correctness of the program.
In distributed systems terms:If a component works with a base interface, you must be able to swap in any derived implementation – under high load, network partitions, and partial failures – without breaking the system’s business logic or safety guarantees.

🚚 RealWorld Context: LogiSynapse Shipment Platform
LogiSynapse handles millions of shipments daily across multiple carriers (FedEx, UPS, DHL, regional LTL, drone delivery). It also uses different routing engines, pricing calculators, and tracking providers.
The business rules are highlevel:
- Create shipment → calculate price → assign carrier → track until delivery → handle exceptions
These rules must not change when you swap:
- A pricing engine (flat rate → dynamic surcharge → zonebased)
- A carrier API (FedEx → UPS)
- A routing algorithm (Dijkstra → A* → timewindow constrained)
LSP guarantees that every implementation of a given interface behaves in a way that the core orchestration logic can rely on – without specialcase if checks.

❌ LSP Violation: The “Broken Carrier” Example
Imagine you have a Carrier interface used by the ShipmentOrchestrator.
go
// Base abstraction

```go

type Carrier interface {

    CreateShipment(shipment Shipment) (TrackingID, error)
    CancelShipment(trackingID TrackingID) error
    GetTrackingStatus(trackingID TrackingID) (Status, error)
}
Now two implementations:
FedExCarrier – works correctly
CheapRegionalCarrier – violates LSP
go
// FedEx implementation – follows expected behavior


type FedExCarrier struct {
    client *fedex.Client
}


func (f *FedExCarrier) CreateShipment(s Shipment) (TrackingID, error) {
    // Always returns a valid tracking ID within 2 seconds
    return f.client.BookShipment(s)
}


func (f *FedExCarrier) CancelShipment(id TrackingID) error {
    // Cancellation always works within 5 seconds
    return f.client.VoidShipment(id)
}


func (f *FedExCarrier) GetTrackingStatus(id TrackingID) (Status, error) {
    // Returns one of: CREATED, IN_TRANSIT, DELIVERED, EXCEPTION
    return f.client.GetStatus(id)
}
```


// RegionalCarrier implementation – VIOLATES LSP

```go

type RegionalCarrier struct {
    client *regional.Client
}


func (r *RegionalCarrier) CreateShipment(s Shipment) (TrackingID, error) {
    // Violation #1: Stronger precondition – cannot handle shipments > 50kg
    if s.WeightKg > 50 {
        return "", errors.New("weight limit exceeded")  // New error type
    }

    // Violation #2: Sometimes returns empty string as tracking ID
    if s.Destination == "rural" {
        return "", nil  // No error, but empty ID – unexpected
    }
    return r.client.Book(s), nil
}



func (r *RegionalCarrier) CancelShipment(id TrackingID) error {
    // Violation #3: Cancellation not supported – throws new error type
    return errors.New("cancellation not allowed after 1 hour")
}


func (r *RegionalCarrier) GetTrackingStatus(id TrackingID) (Status, error) {
    // Violation #4: Returns status values not in the original set
    if id == "" {
        return "UNKNOWN", nil  // UNKNOWN not in base contract
    }

    return "PENDING", nil       // PENDING instead of CREATED – different semantics
}
Now the core orchestration logic:
go


type ShipmentOrchestrator struct {
    carrier Carrier
}


func (o *ShipmentOrchestrator) ProcessShipment(ctx context.Context, req *ShipmentRequest) error {
    // Step 1: Create shipment
    trackingID, err := o.carrier.CreateShipment(req.Shipment)
    if err != nil {
        return fmt.Errorf("create failed: %w", err)
    }

    if trackingID == "" {
        // LSP violation: base contract never allows empty ID
        panic("empty tracking ID")  // This should never happen
    }

    // Step 2: Store mapping (business rule)
    err = o.storeMapping(trackingID, req.OrderID)
    if err != nil {
        // Attempt to cancel if store fails
        _ = o.carrier.CancelShipment(trackingID)
        return err
    }

    // Step 3: Start tracking goroutine (high concurrency)
    go o.monitorTracking(trackingID)
    return nil
}
What happens when you swap FedExCarrier for RegionalCarrier?
Shipments over 50kg start failing with a new error type that the orchestrator never expected → retry loops → resource exhaustion.
Rural shipments return empty trackingID → storeMapping fails → orchestrator panics.
Cancellation after 1 hour fails silently (new error type is ignored by _ but should have been handled).
Monitoring goroutine receives "PENDING" status, which the business logic doesn’t recognise → metrics break, alerts misfire.
Result: The system becomes incorrect despite no change to the business logic. That’s an LSP violation.

🔥 HighConcurrency Implications of LSP Violations
In a distributed system doing 10k+ RPS, LSP violations cause subtle, catastrophic failures:
| Violation Type                                   | Behaviour Under Load                                                      | Failure Mode                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Stronger precondition (e.g., weight limit)       | Requests start failing at rate of violated condition                      | Circuit breaker opens → all shipments blocked     |
| Weaker postcondition (e.g., empty ID)            | Downstream stores receive invalid keys → DB constraint violation          | Cascading writes fail, transaction aborts         |
| New error type not in base                       | Error handling code ignores it → resource leak (shipment never cancelled) | Carrier bills you, customer never notified        |
| Different semantics (status values)              | Aggregators doublecount states → SLA dashboard shows 200% delivered       | Incorrect business decisions, customer complaints |
| Hidden side effects (e.g., writes to local disk) | Concurrent calls race on file → corruption, panics                        | Whole service crashes intermittently              |
Senior interview insight:“When you design an interface for a highthroughput system, you are not just defining method signatures. You are defining a behavioural contract that every implementation must honour – even under partial failures, retries, and concurrency.”

✅ LSPCompliant Design for Shipment Carriers
Step 1 – Define the contract (in code + tests)
go
// Carrier handles shipment lifecycle with a logistics provider.
//
// CONTRACT (all implementations must obey):
// 1. CreateShipment:
//    - Input: any Shipment (weight up to 2000kg, any origin/dest)
//    - Returns: nonempty TrackingID (string length >= 6) or a welldefined error
//    - Error types: only ErrNetwork, ErrAuth, ErrRateLimit – never ErrUnsupported
//    - Must complete within 3 seconds (p99)
//    - Must be idempotent for same Shipment (retry safety)
//
// 2. CancelShipment:
//    - Input: valid TrackingID (from CreateShipment)
//    - Returns: nil if cancelled or already delivered; error only for network/auth issues
//    - Must be idempotent
//    - Must complete within 2 seconds (p99)
//
// 3. GetTrackingStatus:
//    - Returns: one of StatusCreated, StatusInTransit, StatusDelivered, StatusException
//    - Never returns unknown or custom status strings
//    - Must complete within 1 second (p99)
//
// 4. Concurrency: all methods are safe to call from multiple goroutines simultaneously.
// 5. Backpressure: implementations must respect context cancellation and deadlines.


type Carrier interface {

    CreateShipment(ctx context.Context, shipment Shipment) (TrackingID, error)
    CancelShipment(ctx context.Context, trackingID TrackingID) error
    GetTrackingStatus(ctx context.Context, trackingID TrackingID) (Status, error)
}
Step 2 – Implement each carrier respecting the contract
go
// FedExCarrier – follows contract


type FedExCarrier struct {
    client *fedex.Client
    mu     sync.RWMutex  // for internal metrics, not needed for concurrency
}


func (f *FedExCarrier) CreateShipment(ctx context.Context, s Shipment) (TrackingID, error) {
    // Handle heavy shipments by splitting (internal adaptation)
    if s.WeightKg > 50 {
        s = s.SplitIntoParcels()  // No error, just different implementation
    }

    id, err := f.client.BookWithContext(ctx, s)
    if err != nil {
        if strings.Contains(err.Error(), "timeout") {
            return "", ErrNetwork
        }
        return "", err
    }
    if id == "" {
        return "", errors.New("carrier returned empty ID")  // fail fast, never return empty
    }
    return TrackingID(id), nil
}

// RegionalCarrier – fixed to obey LSP


type RegionalCarrier struct {
    client   *regional.Client
    fallback Carrier  // for shipments beyond capability
}


func (r *RegionalCarrier) CreateShipment(ctx context.Context, s Shipment) (TrackingID, error) {
    // No precondition – handle internally
    if s.WeightKg > 50 {
        // Instead of error, use fallback carrier (LSPcompliant composition)
        return r.fallback.CreateShipment(ctx, s)
    }

    id, err := r.client.Book(ctx, s)
    if err != nil {
        return "", mapError(err)
    }
    if id == "" {
        // Generate a synthetic tracking ID to preserve contract
        id = generateSyntheticID(s)
    }
    return TrackingID(id), nil
}



func (r *RegionalCarrier) CancelShipment(ctx context.Context, id TrackingID) error {
    // If cancellation not supported, noop (idempotent) but never error
    if time.Since(id.CreatedAt) > 1*time.Hour {
        return nil  // Silently ignore – still obeys contract
    }

    return r.client.Cancel(ctx, string(id))
}



func (r *RegionalCarrier) GetTrackingStatus(ctx context.Context, id TrackingID) (Status, error) {
    raw, err := r.client.Status(ctx, string(id))
    if err != nil {
        return StatusUnknown, err
    }

    // Map custom statuses to standard enum
    switch raw {
    case "PENDING", "CREATED":
        return StatusCreated, nil
    case "MOVING", "EN_ROUTE":
        return StatusInTransit, nil
    case "DONE":
        return StatusDelivered, nil
    default:
        return StatusException, nil
    }
}
Now the ShipmentOrchestrator works identically for any carrier – FedEx, Regional, DHL, even a mock for testing – without any if carrier == regional checks.

🧪 Testing LSP Under High Concurrency
You must write propertybased or fuzz tests that verify substitutability:
go


func TestCarrierSubstitution(t *testing.T) {
    carriers := []Carrier{
        &FedExCarrier{},
        &RegionalCarrier{fallback: &FedExCarrier{}},
        &MockCarrier{},
    }

    for _, carrier := range carriers {
        t.Run(reflect.TypeOf(carrier).Name(), func(t *testing.T) {
            t.Parallel()
            // Run 1000 concurrent operations
            var wg sync.WaitGroup
            for i := 0; i < 1000; i++ {
                wg.Add(1)
                go func() {
                    defer wg.Done()
                    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
                    defer cancel()
                    shipment := randomShipment()  // includes heavy, cross-border, rural
                    id, err := carrier.CreateShipment(ctx, shipment)
                    if err != nil {
                        // Only allowed errors: network, auth, rate limit
                        if !isAllowedError(err) {
                            t.Errorf("unexpected error: %v", err)
                        }
                        return
                    }
                    if len(id) < 6 {
                        t.Errorf("tracking ID too short: %q", id)
                    }
                    // ... further checks
                }()
            }
            wg.Wait()
        })
    }
}

📦 RealWorld Distributed System Example: MultiCarrier Shipment Router
LogiSynapse has a Shipment Router that chooses the cheapest carrier meeting delivery SLA. It works with a Carrier interface. Because all carriers obey LSP, the router can:
Query each carrier in parallel for price and estimated transit time
Select the best one
Fallback gracefully when one carrier is slow or failing
go


type CarrierRouter struct {
    carriers []Carrier
}


func (r *CarrierRouter) Route(ctx context.Context, shipment Shipment) (*Decision, error) {
    type result struct {
        carrier Carrier
        quote   *Quote
        err     error
    }

    results := make(chan result, len(r.carriers))

    // Fanout to all carriers concurrently
    for _, c := range r.carriers {
        go func(carrier Carrier) {
            quote, err := carrier.GetQuote(ctx, shipment)  // LSP ensures consistent behaviour
            results <- result{carrier: carrier, quote: quote, err: err}
        }(c)
    }

    // Collect with timeout
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    var best *Quote
    var bestCarrier Carrier
    for i := 0; i < len(r.carriers); i++ {
        select {
        case res := <-results:
            if res.err != nil {
                continue  // Allowed errors – LSP guarantees no unexpected ones
            }
            if best == nil || res.quote.Price < best.Price {
                best = res.quote
                bestCarrier = res.carrier
            }
        case <-ctx.Done():
            break
        }
    }
    if best == nil {
        return nil, ErrNoCarrierAvailable
    }
    return &Decision{Carrier: bestCarrier, Quote: best}, nil
}
Because every Carrier implements the same behavioural contract, this router works correctly even when some carriers are slow, return errors, or have internal complexities. No switch on carrier type needed.

🔍 How to Detect LSP Violations in Your Codebase
Code Smell
Likely LSP Violation
Type assertion or type switch on interface value
Subtypes need special handling → not substitutable
Method that returns error but only some implementations return that error
Contract not honoured
Comments like “this implementation doesn’t support X”
Stronger precondition
Unit tests that pass for one implementation but fail for another
Postconditions differ
Panic in production after swapping a dependency
Hidden side effects or concurrency unsafety
Retry loops that never succeed for certain inputs
Unexpected error types or idempotency broken

📌 Summary for a Senior System Design Interview
LSP is not about syntax – it’s about semantics.
“If you have a Carrier interface, swapping from FedEx to RegionalCarrier should not require changing any line of business logic, even under 10k RPS and network partitions.”
Key takeaways for distributed systems:
Define contracts explicitly – input ranges, output guarantees, error types, concurrency safety, latency bounds.
Subtypes may only weaken preconditions and strengthen postconditions – never the opposite.
Test substitutability under high concurrency – property tests, fuzz tests, chaos experiments.
Use composition and fallbacks to adapt nonconforming implementations without breaking LSP.
Remember: In a microservices world, your interfaces are APIs – swapping a client for another must not break the caller’s assumptions.
The ultimate LSP test:Could you replace a core implementation with a completely different technology (gRPC → message queue, SQL → NoSQL, FedEx → drone swarm) without changing the orchestrator?If yes → you’ve followed LSP.If no → you have a design that will hurt you in production.

