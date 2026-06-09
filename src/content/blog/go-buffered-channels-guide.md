---
title: "Go Channels Deep Dive: When and Why to Use Buffered Channels"
description: "Master Go channels - understand buffered vs unbuffered channels and avoid common concurrency pitfalls in production systems."
date: 2026-06-09
author: "Aunmoy Dey Tanmoy"
tags: ["Go", "Concurrency", "Channels", "Best Practices"]
image: "/blog-go-channels.jpg"
---

# Go Channels: Buffered vs Unbuffered - A Production Perspective

One of the most misunderstood aspects of Go concurrency is channels, specifically the distinction between buffered and unbuffered channels. I've debugged countless deadlocks and race conditions that stemmed from misusing channels. Let me share what I've learned.

## The Basics

### Unbuffered Channels

```go
// Unbuffered: sender blocks until receiver is ready
ch := make(chan string)

// This goroutine will BLOCK until someone receives
go func() {
    ch <- "Hello"  // Blocks here!
    fmt.Println("Sent")
}()

// Without this receive, the goroutine would hang forever
fmt.Println(<-ch)  // Unblocks the sender
fmt.Println("Done")

// Output:
// Hello
// Sent
// Done
```

**Key point**: Unbuffered channels are synchronous. Both sender and receiver must be ready simultaneously.

### Buffered Channels

```go
// Buffered: sender blocks only when buffer is full
ch := make(chan string, 2)  // Buffer capacity = 2

go func() {
    ch <- "Hello"   // Doesn't block - buffer has space
    ch <- "World"   // Doesn't block - buffer still has space
    // ch <- "!!!"   // Would block - buffer is full
    fmt.Println("All sent")
}()

fmt.Println(<-ch)  // Hello
fmt.Println(<-ch)  // World
fmt.Println("Done")

// Output:
// All sent
// Hello
// World
// Done
```

**Key point**: Buffered channels are asynchronous up to their capacity.

## When to Use Each

### Use Unbuffered Channels

#### 1. **Request-Response Patterns**

```go
type Request struct {
    ID    string
    Data  string
}

type Response struct {
    ID    string
    Result string
    Error error
}

func processRequest(req Request, respChan chan Response) {
    // Sender and receiver coordinate perfectly
    result := heavyComputation(req.Data)
    respChan <- Response{
        ID:     req.ID,
        Result: result,
    }
}

// Main function
req := Request{ID: "1", Data: "data"}
respChan := make(chan Response)

go processRequest(req, respChan)

resp := <-respChan  // Waits for response - synchronous
fmt.Printf("Got response: %v\n", resp)
```

**Why unbuffered?** You want to ensure the response is processed before continuing.

#### 2. **Synchronization Points**

```go
func worker(id int, done chan bool) {
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
    done <- true  // Signal completion
}

func main() {
    done := make(chan bool)
    
    // Start 3 workers
    for i := 1; i <= 3; i++ {
        go worker(i, done)
    }
    
    // Wait for all to complete
    for i := 1; i <= 3; i++ {
        <-done  // Blocks until worker signals
    }
    
    fmt.Println("All workers done")
}

// Output (approximately):
// Worker 1 starting
// Worker 2 starting
// Worker 3 starting
// Worker 1 done
// Worker 2 done
// Worker 3 done
// All workers done
```

**Why unbuffered?** You must know when workers complete before proceeding.

### Use Buffered Channels

#### 1. **Producer-Consumer with Rate Decoupling**

```go
func fetchUserData(userIDs []string, resultsChan chan<- map[string]interface{}) {
    // Producer: sends as fast as it can
    for _, id := range userIDs {
        data := fetchFromDatabase(id)
        // Non-blocking send (up to buffer capacity)
        resultsChan <- data
    }
    close(resultsChan)
}

func processUserData(results <-chan map[string]interface{}) {
    // Consumer: processes at its own pace
    for data := range results {
        // Expensive processing
        fmt.Printf("Processing user: %v\n", data)
        time.Sleep(time.Millisecond * 100)  // Slow consumer
    }
}

func main() {
    // Buffer size = 10 means producer can get 10 items ahead
    resultsChan := make(chan map[string]interface{}, 10)
    
    userIDs := []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}
    
    go fetchUserData(userIDs, resultsChan)
    processUserData(resultsChan)
}
```

**Why buffered?** Decouples production and consumption rates. Fast producer doesn't need to wait for slow consumer (up to buffer limit).

#### 2. **Worker Pool with Task Queue**

```go
type Task struct {
    ID   string
    Work func()
}

func workerPool(numWorkers int, tasks <-chan Task) {
    var wg sync.WaitGroup
    
    // Start worker goroutines
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            
            for task := range tasks {
                fmt.Printf("Worker %d processing task %s\n", workerID, task.ID)
                task.Work()
            }
        }(i)
    }
    
    wg.Wait()
}

func main() {
    // Buffered channel: queue tasks without blocking producer
    tasks := make(chan Task, 100)
    
    go workerPool(4, tasks)  // 4 workers
    
    // Queue tasks quickly
    for i := 1; i <= 20; i++ {
        tasks <- Task{
            ID: fmt.Sprintf("task-%d", i),
            Work: func() {
                time.Sleep(time.Millisecond * 50)
            },
        }
    }
    
    close(tasks)
    time.Sleep(time.Second)
}
```

**Why buffered?** Tasks can pile up if workers are busy. We don't want task producers to block.

#### 3. **Batch Processing**

```go
func batchProcessor(batchSize int, input <-chan int, output chan<- []int) {
    batch := make([]int, 0, batchSize)
    ticker := time.NewTicker(100 * time.Millisecond)
    defer ticker.Stop()
    
    flushBatch := func() {
        if len(batch) > 0 {
            // Send copy of batch
            output <- append([]int{}, batch...)
            batch = batch[:0]
        }
    }
    
    for {
        select {
        case num, ok := <-input:
            if !ok {
                // Channel closed
                flushBatch()
                close(output)
                return
            }
            batch = append(batch, num)
            if len(batch) == batchSize {
                output <- append([]int{}, batch...)
                batch = batch[:0]
            }
        case <-ticker.C:
            flushBatch()
        }
    }
}
```

## Anti-Patterns and Gotchas

### ❌ Buffered Channel Deadlock

```go
func bad() {
    ch := make(chan int, 1)
    
    // This deadlocks! Buffer is full, no one receiving
    ch <- 1
    ch <- 2  // DEADLOCK - buffer capacity is 1!
}

// ✅ Fixed
func good() {
    ch := make(chan int, 2)  // Bigger buffer
    ch <- 1
    ch <- 2
    
    fmt.Println(<-ch)
    fmt.Println(<-ch)
}
```

### ❌ Sending on Closed Channel

```go
func bad() {
    ch := make(chan int, 1)
    close(ch)
    ch <- 1  // PANIC: send on closed channel!
}

// ✅ Fixed
func good() {
    ch := make(chan int, 1)
    ch <- 1
    close(ch)
    
    for val := range ch {
        fmt.Println(val)
    }
}
```

## Decision Guide

```
┌─ Do you need synchronization?
│  ├─ YES → Unbuffered channel
│  │  (sender and receiver wait for each other)
│  └─ NO → Buffered channel
│     (producer-consumer decoupling)
│
├─ Is it request-response?
│  └─ YES → Unbuffered
│
├─ Do you need to wait for completion?
│  └─ YES → Unbuffered + sync.WaitGroup
│
├─ Is it producer-consumer?
│  └─ YES → Buffered (set size based on expected backlog)
│
└─ Is it worker pool?
   └─ YES → Buffered (queue size = expected task backlog)
```

## Real-World Recommendation

**For infrastructure/service code:**

```go
// API handlers - unbuffered for synchronous request/response
type Handler struct {
    processor chan *Request  // Buffered to queue requests
    results   chan *Response // Unbuffered - must send back
}

// Event processing - buffered to decouple sources/processors
type EventBus struct {
    events chan Event  // Buffered, events queue up
}

// Shutdown coordination - unbuffered for precise synchronization
type Service struct {
    shutdown chan struct{}  // Unbuffered - signal EXACTLY when done
}
```

## Key Takeaways

1. **Unbuffered = Synchronous**: Both sides must be ready
2. **Buffered = Asynchronous**: Decouples producer and consumer
3. **Deadlocks** happen when you send to full buffer with no receiver
4. **Buffer size matters**: Set it based on expected backlog
5. **Close from sender side**: Receiver should read until closed
6. **Use select for timeouts**: Prevent infinite blocking

## Conclusion

The choice between buffered and unbuffered channels isn't arbitrary—it reflects how your goroutines should communicate. Unbuffered for tight synchronization, buffered for loose coupling. Understanding this distinction is crucial for writing deadlock-free, high-performance concurrent Go code.

In my infrastructure projects, I've found that thoughtful channel design prevents 90% of concurrency bugs before they even occur.
