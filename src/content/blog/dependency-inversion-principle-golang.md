---
title: "Dependency Inversion Principle (DIP) in Go: Writing Loose, Testable Code"
description: "Learn how to implement the Dependency Inversion Principle in Go, mapping abstractions to interfaces to decouple high-level logic from low-level details."
pubDate: "2026-06-06"
author: "Aunmoy Dey Tanmoy"
tags: ['Design Patterns', 'SOLID', 'Go', 'Clean Code']
image: "/blog-assets/dependency-inversion-principle-golang.jpg"
---

Dependency Inversion Principle (DIP) in Golang

The Dependency Inversion Principle (DIP) is the D in SOLID.  It says that
High Level Modules should not depends on Low Level Modules, Both should depend on Abstraction.Now You Might ask what is High-level and Low-level? How do I know? and How do I Understand?for a moment think about Uber? how it works? its main business rule is 
Match Rider With Driver ------>  Calculate Fare ------> Track Ride
So Uber exists Because of these. These are Business Rules.  That’s why this is High-Level
Now think about these what tools uber actually use, obviously you are thinking about google maps API, Stripe SDK for payment, Kafka or Redis, Postgres for Database. So these are called Low-Level, cause These are tools, uber can change them tomorrow. Now you may understand what Low-Level and What is High-Level modules.
 MOST IMPORTANT RULE to remember:  If replacing it changes business meaning → high-level
  If replacing it changes only implementation → low-level
So High-Level = Business Policy / Core Logic. It contains: Business rules, business decisions and application behavior. It answers: “WHAT the system does”

And Low-Level = Technical Details / Infrastructure. It contains: SDKs, databases, APIs, frameworks, HTTP calls, Kafka clients, Redis drivers. It answers: “HOW it is done”
Now back to the Topic, so DIP says, High Level Modules should not depends on Low Level Modules, Both should depend on Abstraction. 
And Abstraction should not depends on details, Details should depends on Abstraction
This principle becomes critical when:
- external APIs change
- databases change
- Kafka/RabbitMQ changes
- payment providers change
- cloud vendors change
- AI providers change (OpenAI → Claude → Gemini)

 DIP says:
“Your business logic should not care WHICH provider is used.”
Instead:
- business logic depends on an interface
- implementations depend on that interface
Most juniors think “DIP means using interfaces.” But NO. That is only 20%.
Real DIP means: Business rules must remain stable while infrastructure changes freely.
package shipment

import "github.com/openai/openai-go"


```go

type ShipmentService struct {
    client *openai.Client
}


func (s *ShipmentService) GenerateSummary(text string) (string, error) {
    resp, err := s.client.ChatCompletion(...)
    if err != nil {
        return "", err
    }

    return resp.Content, nil
}
What happened there ? Now your core business logic depends directly on:
OpenAI SDK 
OpenAI response structure 
OpenAI authentication 
OpenAI API contract
But what If I want to add Gemini or claude or if OIpenAI api/Authentication change than ? I need to reWrite the whole service.  That violates Dip . 
The Resolution: Fixing the Code (The Go Way)
In Golang, DIP is uniquely elegant because interfaces are satisfied implicitly means I don’t have to name it when use if I use its method it automatically satisfy the interface 
Crucially, to achieve true Dependency Inversion, the high-level component must own the interface. The business logic defines the contract of what it needs; the infrastructure layer adapts to it.
Here is how you refactor your shipment service to be completely resilient against AI vendor churn:
The High-Level Domain (Stable)



package shipment

import "context"

// Summarizer is the PORT. The shipment service owns this contract.
// It doesn't care if it's OpenAI, Gemini, or a shell script.


type Summarizer interface {

    GenerateSummary(ctx context.Context, text string) (string, error)
}



type ShipmentService struct {
    // High-level depends only on the abstraction
    summarizer Summarizer 
}


func NewService(s Summarizer) *ShipmentService {
    return &ShipmentService{summarizer: s}
}


func (s *ShipmentService) ProcessShipmentLog(ctx context.Context, logData string) (string, error) {
    // Core business logic rules go here (e.g., validation, status checks)
    
    summary, err := s.summarizer.GenerateSummary(ctx, logData)
    if err != nil {
        return "", err
    }

    return summary, nil
Step 1 — Abstraction
package ai or package Shipment



type Summarizer interface {

    Summarize(text string) (string, error)
}


WHAT IS THIS?
This is:
abstraction 
business contract 
boundary 
Notice: It says: "I need text summarized."
It DOES NOT say:
OpenAI 
GPT 
Claude 
HTTP 
REST API 
That is critical.

Step 2 — High-Level Module
package shipment

import "myapp/ai"



type ShipmentService struct {
    summarizer ai.Summarizer
}


func NewShipmentService(s ai.Summarizer) *ShipmentService {
    return &ShipmentService{
        summarizer: s,
    }

}



func (s *ShipmentService) GenerateShipmentInsight(text string) (string, error) {
    return s.summarizer.Summarize(text)
}
```



WHY IS ShipmentService HIGH-LEVEL?
Because this is BUSINESS LOGIC.
This service represents:
- shipment intelligence
- shipment analysis
- logistics workflow
This is CORE DOMAIN behavior.
Your company exists because of shipment business logic.
NOT because of OpenAI.
IMPORTANT
ShipmentService says: "I need a summarizer."NOT: "I need OpenAI SDK." This is the key.
NOW LOOK AT LOW-LEVEL MODULE
package openaiimpl

import (
    openai "github.com/openai/openai-go"
)


```go

type OpenAISummarizer struct {
    client *openai.Client
}
```

WHY IS THIS LOW-LEVEL?
Because this is INFRASTRUCTURE DETAIL.
This code deals with:
- external SDK
- HTTP APIs
- authentication
- request formatting
- response parsing
These are implementation details.

THIS IS THE BIGGEST KEY
Your company/business does NOT care:
- how OpenAI API works
- how JSON is parsed
- what HTTP endpoint exists
Those are technical details.
WHERE DIP VIOLATION HAPPENS
BAD DESIGN

```go

type ShipmentService struct {
    client *openai.Client
}
```

LOOK carefully.
Now:
High-level module depends on low-level module
Because:
- ShipmentService = business logic
- openai.Client = infrastructure detail
This violates DIP.

VISUALIZE IT

BEFORE DIP (BAD)
ShipmentService
```text
      ↓
```
- OpenAI SDK
```text
      ↓
```
Business depends on detail
```text
      ↓
```
If OpenAI changes
```text
      ↓
```
business code changes 
BAD.

AFTER DIP (GOOD)
ShipmentService
```text
      ↓
```
Summarizer Interface
```text
      ↑
```
OpenAI Implementation
NOW: implementation depends on abstraction . This is inversion.

THE SENIOR GO CATCH: Consumer-Driven Interfaces
In many languages (like Java or C#), interfaces are placed with the implementation. In junior designs, developers create a package ai containing the interface.
This is a mistake in Go. In Go, the side that uses the behavior owns the interface. The interface belongs inside the high-level business package next to the code that calls it. Because Go interfaces are satisfied implicitly, the low-level infrastructure package doesn't even need to know the high-level package exists!
High-Level Domain Layer
package shipment

import "context"

// Summarizer is the PORT/CONTRACT. 
// The shipment package OWN this because it defines what the shipment business needs.
// Notice: It uses context.Context (critical for 2026 microservice tracing/timeouts).

```go

type Summarizer interface {

    Summarize(ctx context.Context, text string) (string, error)
}

// ShipmentService is HIGH-LEVEL because it represents pure BUSINESS POLICY.


type ShipmentService struct {
    summarizer Summarizer // Depends strictly on the abstraction
}


func NewShipmentService(s Summarizer) *ShipmentService {
    return &ShipmentService{
        summarizer: s,
    }

}



func (s *ShipmentService) GenerateShipmentInsight(ctx context.Context, text string) (string, error) {
    // Core business logic rules happen here (e.g., validation, events logging)
    return s.summarizer.Summarize(ctx, text)
}
```


Step 2 — Low-Level Infrastructure Implements the Abstraction
The infrastructure layer contains volatile details that change based on cloud vendors, cost optimizations, or API updates.

Low-Level Infrastructure Layer (OpenAI Implementation)
package openaiimpl

import (
    "context"
    "fmt"
    openai "github.com/openai/openai-go"
)


```go

type OpenAISummarizer struct {
    client *openai.Client
}


func NewOpenAISummarizer(client *openai.Client) *OpenAISummarizer {
    return &OpenAISummarizer{client: client}
}
```


// Summarize satisfies shipment.Summarizer implicitly without importing the shipment package!

```go

func (o *OpenAISummarizer) Summarize(ctx context.Context, text string) (string, error) {
    // Technical details: SDK calls, JSON formatting, HTTP transport rules
    resp, err := o.client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
        // ... parameters
    })
    if err != nil {
        // SENIOR MOVE: Map infrastructure errors to clean domain errors
        return "", fmt.Errorf("openai provider failure: %w", err)
    }

    return resp.Choices[0].Message.Content, nil
}

Visualizing the Architectural Shift
Before DIP (Tightly Coupled & Volatile)
[ShipmentService (Business)] ───> Depends On ───> [OpenAI SDK (Detail)]
Result: If OpenAI introduces a breaking change to their SDK or you want to switch to Gemini, your core business code breaks and requires a rewrite.
After DIP (Inverted Control)
[ShipmentService (Business)] ───> Uses ───> [Summarizer Interface (Contract)]
                                                     ▲
                                                 Implements
                                                     │
                                         [OpenAISummarizer (Detail)]
Result: The dependency direction flipped. The infrastructure layer now adapts to the rules defined by your business.

The Senior System Design Interview Playbook (2026 Meta)
When interviewing for a Senior or Lead System Design role, DIP is not just an object-oriented coding rule; it is the fundamental tool for building Resilient, Scalable Distributed Systems.

```

## 1. Handling Provider Churn & Fallbacks (The Multi-LLM Pattern)

In production, relying on a single external dependency (like OpenAI) creates a Single Point of Failure (SPOF). DIP allows you to write an architectural fallback engine at the infrastructure layer without changing one line of business logic.
// FailoverAIAdapter implements shipment.Summarizer

```go

type FailoverAIAdapter struct {
    primary   shipment.Summarizer // e.g., OpenAI
    secondary shipment.Summarizer // e.g., Gemini
}


func (f *FailoverAIAdapter) Summarize(ctx context.Context, text string) (string, error) {
    res, err := f.primary.Summarize(ctx, text)
    if err != nil {
        // Primary failed or rate-limited! Circuit breaker trips and falls back seamlessly.
        return f.secondary.Summarize(ctx, text)
    }

    return res, nil
}
Guarding the Domain Boundary against "Leakage"
A common mistake seniors call out in code reviews is Data Model Leakage. If your business service passes or receives a database struct (like a GORM model) or an API response struct directly, your abstraction is broken.
The Rule: Low-level adapters must map infrastructure data models into clean, decoupled Domain Entities before delivering them across the interface boundary to your High-Level service.

```

## 3. Ultimate Testing Isolation

When testing code adhering to DIP, you avoid complex mock generators or hitting real databases/live APIs. You can easily pass a lightweight test double right inside your testing file:

```go

type MockSummarizer func(text string) (string, error)

func (m MockSummarizer) Summarize(ctx context.Context, text string) (string, error) {
    return m(text)
}


func TestShipmentService(t *testing.T) {
    mock := MockSummarizer(func(text string) (string, error) {
        return "mocked summary", nil
    })
    
    service := shipment.NewShipmentService(mock)
    // Execute tests rapidly in-memory with zero network or flaky IO dependencies
}
```

Core Identification Cheat Sheet
| Metric     | High-Level Modules                                      | Low-Level Modules                                        |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Focus      | WHAT the system does (Policies & Workflows)             | HOW the system does it (Mechanisms & Tools)              |
| Volatility | Highly Stable (Changes only when business models pivot) | Highly Volatile (Changes when dependencies upgrade/swap) |
| Examples   | OrderPipeline, FraudEngine, FareCalculator              | PostgresDriver, KafkaProducer, StripeSDK, gRPCClient     |
| Ownership  | Owns the business interfaces (Ports)                    | Implements the interfaces (Adapters)                     |
Ultimate Mental Model
"Our business exists to move shipments efficiently and compute routing logistics. It does not exist to run SQL queries, serialize Protobuf strings, or structure third-party JSON payloads. The tools must serve the architecture; the architecture must never surrender to the tools."



WHERE EXACTLY THE INVERSION HAPPENS
THIS LINE:
summarizer ai.Summarizer
This changes dependency direction.
Before:
ShipmentService → OpenAI
After:
ShipmentService → Interface ← OpenAI
Now OpenAI depends on YOUR abstraction.
Not vice versa.
That is Dependency INVERSION.

THIS IS THE MOST IMPORTANT THING
Originally:
Business → Infrastructure
After DIP:
Infrastructure → Business Contract
The dependency direction flipped.

HOW TO IDENTIFY HIGH-LEVEL VS LOW-LEVEL
Ask these questions:

Question 1
“Does this contain business policy?”
If YES → High-level
Examples:
- shipment rules
- pricing logic
- order workflow
- recommendation engine

Question 2
“Is this replaceable technology?”
If YES → Low-level
Examples:
- OpenAI
- Kafka
- Postgres
- Redis
- Stripe SDK

Question 3
“Would business survive if this changed?”
If YES → low-level
Example:
- Replace PostgreSQL with MongoDB
- Replace OpenAI with Claude
Business still exists.
Therefore infrastructure is low-level.

Question 4
“Does this describe WHAT or HOW?”

WHAT = High-level
Summarize shipment insightsProcess paymentTrack shipment

HOW = Low-level
HTTP POST requestKafka producerSQL queryRedis SET

Another SUPER IMPORTANT Example

BAD

```go

type OrderService struct {db *sql.DB}
```

Why bad?
Business depends directly on database technology.

GOOD

```go

type OrderRepository interface {Save(order Order) error}
```

Now OrderService depends on business abstraction.

WHY INTERFACE BELONGS TO HIGH-LEVEL
This is subtle and VERY important.

BAD THINKING
Junior thinks:
OpenAI created the API,so interface belongs near OpenAI.
Wrong.

CORRECT THINKING
The business defines WHAT it needs.
Business says:
"I need summarization."
So business owns abstraction.

Golden Rule
The side that USES behavior should own the interface.
NOT the side implementing it.

REAL ENTERPRISE EXAMPLE
In your AI Logistics SaaS:

High-Level
Shipment DomainTracking LogicETA PredictionFraud DetectionPricing Rules

- Low-Level
KafkaPostgresRedisOpenAIAWS S3gRPC transport

Senior Architect Mentality
A senior engineer always asks:
"What part changes often?"
Those parts should become:
- low-level
- replaceable
- isolated behind abstractions

FINAL GOLDEN MENTAL MODEL

HIGH-LEVEL
Business BrainStableLong-term logicCore company value

- LOW-LEVEL
ToolsSDKsFrameworksExternal systemsReplaceable

Ultimate DIP Sentence
High-level policy should control low-level details.
Low-level details should never control business logic.
  





