---
title: "Scalability High-Level Design: Database Sharding, Replication & Load Balancing"
description: "A senior engineer's guide to scalability, sharding keys, database replication, horizontal scaling, and cost-efficient scheduling."
pubDate: "2026-06-04"
author: "Aunmoy Dey Tanmoy"
tags: ['System Design', 'Scalability', 'Database', 'Architecture']
image: "/blog-assets/scalability-high-level-design.svg"
---

Scalability is a measure of a system’s ability to handle a growing amount of work or an increasing number of users efficiently. It means that if your application serves 1,000 users today, and that number grows to 10 million, the system should continue to perform reliably — without crashing or suffering major performance degradation.Why do we need it? (The "Why")
Systems are built to be used. If a product is successful, its usage will grow. Without scalability, a system has a hard ceiling. Once you hit that ceiling, users experience timeouts, servers crash, data gets dropped, and the business loses money. We design for scalability so that our software can grow organically alongside the business without requiring a complete rewrite of the codebase every time traffic spikes.

Real-World Use Cases (The "What is it used for")
- AI System Engineer Example: Imagine you are hosting a new AI image generation model. On day one, you get 10 requests per minute. Your single GPU handles it fine. Then, your product goes viral on social media, and suddenly you are getting 10,000 requests per second. A scalable AI architecture ensures that incoming requests are queued and processed without dropping user prompts, dynamically spinning up more resources to handle the AI inference.
- Go Software Engineer Example: You write a lightweight Go microservice to process payment transactions. Normally, it processes 500 transactions a second. On Black Friday, traffic spikes by 10x. Because you built the system to be scalable, the infrastructure detects the load, scales up, and processes every payment with the same low latency.

RealWorld Concurrency Example: Payment Gateway Load Surge
Scenario
Imagine a Gobased payment gateway similar to what Stripe or Razorpay uses internally.
- Each incoming payment request triggers a goroutine that validates the transaction, checks fraud rules, and writes to Kafka for downstream processing.
- Under normal load, the system handles 500 requests/sec comfortably.
- On Black Friday, traffic spikes to 5,000 requests/sec.
How Scalability + Concurrency Work Together
- Load Balancer detects increased traffic and spins up more Go service instances (horizontal scaling).
- Each instance runs thousands of goroutines concurrently — lightweight threads managed by Go’s runtime scheduler.
- Shared resources (Kafka producer, Redis client, DB pool) are singleton objects injected at startup, so goroutines reuse them safely.
- The system maintains low latency because:
- Goroutines are multiplexed efficiently across CPU cores.
- Connection pools prevent resource exhaustion.
- Backpressure mechanisms (Kafka batching, Redis pipelining) absorb spikes.
🧠 RealWorld Parallel
This pattern is used by:
- Uber’s Go microservices for trip event ingestion.
- PayPal’s Gobased fraud detection pipeline for concurrent transaction scoring.
- Cloudflare’s edge servers, written in Go, handling millions of concurrent requests globally.
🧩 Mental Model
Code
Incoming Requests → Load Balancer → Go Service Instances
```text
                         │
                         ├── Goroutine 1 → Validate Payment
                         ├── Goroutine 2 → Fraud Check
                         ├── Goroutine 3 → Write to Kafka
                         └── Goroutine N → Update DB
```
Each goroutine runs independently but shares the same infrastructure singletons — that’s concurrencydriven scalability in action.
Would you like me to now move into Vertical Scaling next, showing how this same Go service could scale up on a single machine (CPU/RAM boost, thread optimization, etc.) before we go to Horizontal Scaling?

Pros
- High Availability & Reliability: The system continues to perform under heavy load, ensuring a smooth user experience.
- Cost Efficiency (Long Term): Elastic scaling means resources (and costs) grow only when demand grows, avoiding waste from idle servers.
- Future-Proofing: A scalable architecture reduces the need for complete redesigns as user base or data volume increases.
Cons
- Architectural Complexity: Designing scalable distributed systems requires handling load balancing, caching, network latency, and data consistency — far more complex than monolithic apps.
- Testing Difficulty: Stress-testing at millions of concurrent users is expensive and technically challenging.
Risk of Over-Engineering: Teams may build for “Google-scale” traffic when they only have a few hundred users, wasting time and money.Q:“How you’d handle a system that gets lots of reading and writing traffic at the same time?”
let’s break those “higher-level strategies” down in simple terms so they’re crystal clear:
Caching for reads 🗂️ Imagine you have a library. If 100 people ask for the same book, instead of fetching it from the basement every time, you keep a copy at the front desk. That’s caching: storing frequently accessed data in memory so reads are super fast.  Caching: Using an in-memory distributed cache like Redis to serve heavy read traffic instantly without hitting the database.

Batching writes ✍️ Instead of writing every single small update to the database one by one (which is slow), you collect a bunch of them and write them together in one go. Think of it like mailing letters: instead of running to the post office for each letter, you drop off a whole bag at once.
  Message Queues: Using something like Kafka or RabbitMQ to queue up heavy write requests so the database doesn't get overwhelmed.

Database partitioning (sharding) 🗃️ If your database gets too big, you split it into smaller pieces (shards). Each shard handles part of the data, so queries don’t overload a single machine. It’s like dividing a huge classroom into smaller groups so each teacher can manage fewer students.
👉 So when you say “I’d also consider caching, batching, or partitioning”, you’re showing the interviewer that you’re thinking beyond just Go’s Mutex and RWMutex — you’re thinking about system-level scalability techniques. That’s exactly what senior-level interviewers want to hear.


Q:"What specific system metrics would you monitor to determine if our current system is failing to scale properly?
When engineers want to know if a system is failing to scale, they look at dashboards tracking specific numbers. Google popularized a framework for this called the Four Golden Signals:
- Latency (Response Time): How long does it take to process a request? If your API usually takes 50 milliseconds to respond, but suddenly it takes 3,000 milliseconds, your system is struggling to scale with the load.
- Traffic (Throughput): How much demand is on your system? This is usually measured in Requests Per Second (RPS). Monitoring this tells you when the scaling issue is happening.
- Errors: Are requests failing? If your HTTP 500 errors (Internal Server Errors) or database timeout errors spike from 0.1% to 10%, your system is breaking under the pressure.
- Saturation (Resource Usage): How "full" is your system? This means checking your server's CPU utilization and RAM (Memory) usage. If your CPU is running at 99%, it cannot process any more work, and the system becomes a bottleneck.

As a Senior Engineer, you would look at these metrics and say: "Our CPU saturation is hitting 95% and latency is spiking, we need to scale!"












Verticle Scaling 

Vertical scaling means upgrading a single machine’s capacity — more CPU, RAM, SSD. On the server side, cloud providers like AWS and Azure let you resize instances, so all users benefit from a stronger backend. On the client side, you can’t upgrade each user’s hardware, but you design the system so hardware differences don’t matter: push computation to the backend, serve static files via CDNs, and expose lightweight APIs. The limitation is that hardware has physical ceilings, so beyond a point you need horizontal scaling."


Vertical Scaling: Two Sides

## 1. Server-Side Vertical Scaling

- This is the classic meaning in system design.
- You take one backend machine (physical or virtual) and give it more power:
- More CPU cores
- More RAM
- Faster SSDs
- In cloud providers like AWS, Azure, GCP, you can literally “resize” your instance:
- Example: AWS EC2 t3.medium (2 vCPUs, 4 GB RAM) → upgrade to m5.4xlarge (16 vCPUs, 64 GB RAM).
- Result: All users hitting that server benefit because the backend can handle more concurrent requests.
- Limitation: Hardware has physical limits. You can’t keep adding infinite cores or RAM to one machine — eventually you hit a ceiling.

## 2. Client-Side (Local Machines)

- Each user has their own hardware (phone, laptop, desktop).
- You cannot upgrade their hardware from your system — that’s outside your control.
- What you can do is design your system so client hardware differences don’t matter:
- Push heavy computation to the backend: Example: A mobile app doesn’t calculate analytics locally. Instead, it calls the backend API, which does the computation and returns results. Even a weak phone can use the system.
- Use caching/CDNs: Example: Images, videos, and static files are stored on edge servers (servers geographically close to the user).
- If a user in Bangladesh requests a video, it’s served from a nearby CDN node, not from a US data center.
- This reduces latency and avoids stressing the client device.
- Provide lightweight APIs: Example: A mobile app calls GET /orders.
- The backend aggregates data across shards/databases.
- The client only receives a small JSON response like:
json
{ "orders": [ { "id": "123", "status": "shipped" } ] }
The client doesn’t need to know about sharding, joins, or heavy queries — the backend does all the work.
Why do we need it? (The "Why")
We use vertical scaling because it is incredibly simple. When an application is running slowly due to high resource saturation (remember those Four Golden Signals?), the fastest way to fix it without rewriting a single line of code is simply to buy a bigger server. It is the path of least resistance.

## 3. Real-World Use Cases

- AI System Engineer Example: AI model training is heavily dependent on Vertical Scaling. If you are training a massive Large Language Model (LLM), splitting the model across multiple weak computers over a network creates terrible latency. Instead, you vertically scale by buying a single, massive server chassis packed with multiple top-tier GPUs (like Nvidia H100s) and massive amounts of unified memory so the data can be crunched locally at lightning speed.
- Go Software Engineer Example: You have a legacy, monolithic application running alongside a PostgreSQL database. The database is struggling to keep up with queries. Sharding (splitting) a relational database is very difficult and risky. Instead, you simply upgrade the AWS EC2 instance running the database from 4 cores and 16GB of RAM to 32 cores and 128GB of RAM. Problem solved in five minutes.

## 4. Pros & Cons of Vertical Scaling

Pros:
- Zero Code Changes: Your Go code or AI scripts don't need to be rewritten to support distributed network logic.
- Easy Maintenance: You only have one operating system, one server, and one environment to patch, monitor, and secure.
- No Network Latency: Since everything is on one machine, components communicate instantly via the motherboard or local memory, avoiding the delays of sending data across a network.
Cons:
- The Hardware Ceiling: There is a physical limit to how big a machine can get. You cannot buy a server with 10,000 CPUs. Once you hit the absolute best hardware on the market, you cannot scale vertically anymore.
- Single Point of Failure (SPOF): If your one massive, powerful server has a hardware failure, a power supply blows, or it crashes, your entire system goes down. You have zero redundancy.
- Downtime: Upgrading a machine's CPU or RAM usually requires shutting it down, meaning your users will experience an outage while the server reboots.
- Cost Inefficiency: Hardware pricing is not linear. A server with twice the power might cost four times as much. Top-tier enterprise hardware carries a massive premium.
"Imagine we are running a Go-based API on a single, massive cloud server. We are currently hitting 90% CPU usage during peak hours. A junior engineer suggests we just shut it down tonight and double the CPU and RAM again. As a senior engineer, how would you explain to them the hidden risks of continuing to rely only on vertical scaling for our application?"
So, as a senior engineer, I will tell the juniors that if you increase the CPU or the RAM or SSD, it will make the server most costly. And if you shut the server down for several times all the night, so the user may experience the bad experience. And there is a ceiling of the hardware, so you cannot increase the hardware more and more and more. So, if you use already the latest hardware in the market, so you cannot increase it like further. So, it's impossible to increase it regularly. So, I will explain it to them that you cannot increase the RAM or you cannot increase the GPU or CPU.
