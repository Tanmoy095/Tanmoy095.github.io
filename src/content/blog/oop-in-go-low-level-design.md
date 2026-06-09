---
title: "Object-Oriented Programming in Go: Pragmatic LLD Patterns"
description: "Go doesn't have classes, but it has package-level encapsulation, interface composition, and method attachment. Let's explore pragmatic OOP in Go."
pubDate: "2026-06-05"
author: "Aunmoy Dey Tanmoy"
tags: ['Go', 'OOP', 'Design Patterns', 'Clean Code']
image: "/blog-assets/oop-in-go-low-level-design.jpg"
---

Object-Oriented Programming in Go ( LLD )

Encapsulation (Go’s MOST MISUNDERSTOOD TOPIC)

In Go, encapsulation is not a feature of "Classes"—it is a feature of Packages. As a senior developer, you must view encapsulation not just as a way to hide variables, but as a mechanism for State Integrity Management.
Here is the deep theory of encapsulation in Go, framed for high-level software architecture.


## 1. The Package as the Security Perimeter

In languages like Java or C#, the "Class" is the unit of encapsulation. In Go, the Package is the boundary.
Internal Access: Any code within the same package can see and modify unexported (lowercase) fields of a struct.
External Access: Code outside the package can only interact with exported (Uppercase) identifiers.
Senior Insight: This means you should design your packages based on "Functional Domains." If two structs need to touch each other's private parts to work, they belong in the same package. If they don't, they should be separated to prevent "Leaky Abstractions."


## 2. Invariant Protection (The "Contract of Truth")

The primary goal of encapsulation is to ensure that a struct never enters an invalid state.
If you export a field like Age int, an external user can set Age = -500. By keeping age unexported and providing a SetAge(a int) method, you create a Guardrail.
The Constructor Pattern: By unexporting the fields, you force users to use a New...() function. This allows you to validate data before the object even exists. If the data is bad, you return an error instead of a broken object.


## 3. Implementation Hiding & API Stability

Encapsulation allows you to change the "How" without breaking the "What."
Imagine your Company struct stores a list of employees in a slice. If you export that slice, every user of your package will write code that iterates over that slice. If you later realize a map is faster and change the slice to a map, you break everyone’s code.
The Senior Approach: Hide the slice. Provide a method IterateEmployees(fn func(Employee)). Now, you can change the internal storage to a map, a linked list, or even a database call, and the external API remains exactly the same.


## 4. Encapsulated Concurrency (Thread-Safety)

In a modern, multi-threaded Go environment, encapsulation is your best defense against Data Races.
If a struct has a sync.Mutex, that mutex should never be exported.
Why? If the mutex is public, an external caller could call Lock() and forget to Unlock(), deadlocking your entire service.
The Strategy: Hide the mutex and the data. Ensure every public method on the struct acquires the lock internally. This makes the struct "Thread-Safe by Design."
At a senior level, encapsulation in Go is the practice of Internalizing Complexity. You are building a "black box" where the user cares about the results (the methods) but is strictly forbidden from touching the mechanics (the fields).
🏛️ The Implementation: Secure Wallet System
In this example, we encapsulate a bank account. We must ensure the balance can never be negative and that concurrent updates don't cause data corruption.
internal/finance/account.go
package finance

import (
    "errors"
    "sync"
)

// Account is an Opaque Struct.
// All fields are unexported (lowercase) to prevent external tampering.

```go

type Account struct {
    id      string
    balance float64
    mu      sync.RWMutex // Encapsulated lock: The user doesn't even know it exists.
}
```


// NewAccount is the Gatekeeper. 
// It ensures that every Account starts in a valid state.

```go

func NewAccount(id string, initialDeposit float64) (*Account, error) {
    if initialDeposit < 0 {
        return nil, errors.New("cannot open account with negative balance")
    }
```

    return &Account{
        id:      id,
        balance: initialDeposit,
    }, nil
}

// Deposit encapsulates the logic of adding money.

```go

func (a *Account) Deposit(amount float64) error {
    if amount <= 0 {
        return errors.New("deposit amount must be positive")
    }
```


    a.mu.Lock()         // Thread-safety is handled internally
    defer a.mu.Unlock()

    a.balance += amount
    return nil
}

// Withdraw protects the 'Invariant': Balance cannot be less than zero.

```go

func (a *Account) Withdraw(amount float64) error {
    a.mu.Lock()
    defer a.mu.Unlock()

    if amount > a.balance {
        return errors.New("insufficient funds")
    }
```


    a.balance -= amount
    return nil
}

// GetBalance provides read-only access to a private field.

```go

func (a *Account) GetBalance() float64 {
    a.mu.RLock()
    defer a.mu.RUnlock()
    return a.balance
}
```



🧠 How Encapsulation Works (The Mechanics)
Go uses Identifier Visibility instead of keywords like private or public.
Exported Identifiers (Uppercase): Any name starting with a capital letter (Account, Deposit) is visible to other packages.
Unexported Identifiers (Lowercase): Any name starting with a lowercase letter (balance, mu) is strictly private to the package it was defined in.

🎯 Why Encapsulation is Necessary

## 1. Enforcing Business Invariants

Without encapsulation, a developer could do acc.balance = -999999. By hiding the balance field, you force all changes through the Withdraw method, which contains the logic to prevent negative balances. You aren't just hiding data; you are protecting the truth of your system.

## 2. Thread-Safe by Default

In a high-concurrency environment, if balance were public, two goroutines could modify it simultaneously, causing a "lost update." By encapsulating the sync.RWMutex, the caller doesn't have to worry about locks. They just call Deposit(), and the package guarantees safety.

## 3. Decoupling and Refactoring

Imagine you want to change the balance from a float64 to a more precise big.Int or store it in an external database like Redis.
If fields were public: Every package using your code would break immediately.
With encapsulation: You change the internal field, update your Deposit/Withdraw methods, and the rest of the application never knows the difference.

⚖️ Fundamental Knowledge & Trade-offs
Concept
Description
Senior Perspective
Package Boundary
The limit of visibility.
Group related logic in one package so they can share private fields without exposing them to the whole app.
Zero-Value Safety
What happens if someone does var a Account?
Seniors design for this. If a struct needs a map or mutex initialized, use unexported fields to force the use of a constructor (NewAccount).
Interface Hiding
Returning an interface instead of a struct.
This is "Total Encapsulation." The user only knows the methods; they don't even know what the underlying struct looks like.
💡 The "Senior" Summary
Encapsulation is the Software Engineering equivalent of a "Restricted Area" sign. You are telling other developers: "I have handled the complexity and safety of this data. You just use these 3 buttons (methods) and I promise the system won't break."

“Encapsulation is not about hiding data, it's about controlling behavior.”


🛡️ 5. Secure Encapsulation Pattern 

```go

type ClientCredentials struct {    ID     string    Role   string    apiKey string}

```

Secure Method

```go

func (c *ClientCredentials) ValidateKey(input string) bool {    return subtle.ConstantTimeCompare(        []byte(c.apiKey),        []byte(input),    ) == 1}
```

 Why this matters
Prevents timing attacks 
Keeps secret hidden 
Exposes only safe behavior


```go

type Logger struct {}type UserService struct {    logger Logger}
```

Expose behavior, not sensitive data. 
Real-world Example

```go

type Cache struct {    mu   sync.Mutex    data map[string]string}

🧠 Encapsulation + Concurrency
func (c *Cache) Set(key, value string) {    c.mu.Lock()    defer c.mu.Unlock()    c.data[key] = value}

🎯 Why this is important
thread safety 
race condition prevention 
production readiness 

💡 Interview Answer
“In Go, encapsulation often includes synchronization primitives like mutex to ensure safe concurrent access.”
type APIClient struct {
    apiKey string
    client *http.Client
}
```



```go

func NewAPIClient(key string) *APIClient {
    return &APIClient{
        apiKey: key,
        client: &http.Client{},
    }
```

}


```go

func (a *APIClient) DoRequest() {
    // use apiKey internally
}Real-world extension (LLD thinking)
func (c *ClientCredentials) RotateKey(newKey string) error {    if len(newKey) < 10 {        return errors.New("weak key")    }    c.mu.Lock()    defer c.mu.Unlock()    c.apiKey = newKey    return nil}
👉 validation + safety




```

Composition (REAL OOP in Go)

❌ Traditional OOP  --> UserService extends BaseService

But in Golang

```go

type UserService struct {
    logger Logger // 👉 not promotes methods automatically in composition

}
```

🧠 Why this is powerful
decoupling -> testability -> replaceable components 
In embedding

```go

type UserService struct {
```

    Logger // 👉 promotes methods automatically in embedding
}

🎯 Interview Insight
“Prefer composition for explicit dependencies and embedding for behavior reuse.”

## 1. Composition (The "Explicit" Way)

This is when you give the field a specific name, like logger Logger.
Why use it?
Explicit Control: You decide exactly how the logger is used. If someone uses your UserService, they can't see the logger's methods; they only see what you allow them to see.
Clear Dependencies: It’s obvious that UserService uses a logger to do its job.
Encapsulation: You aren't "polluting" your service's API with logging methods like .Info() or .Debug().
Senior Real-World Use Case: The Service Layer
In a production API, your services (User, Order, Payment) should almost always use composition. You don't want someone to be able to call UserService.Log() from outside the package. You want them to only call UserService.CreateUser().


## 2. Embedding (The "Automatic" Way)

This is when you put the type in the struct without a name.

```go

type UserService struct {
```

    Logger // No field name!
}


Why use it?
Method Promotion: All the methods of Logger are "promoted" to UserService. If Logger has a Log() method, you can call myService.Log() directly.
Interface Satisfaction: If Logger satisfies an interface, UserService now automatically satisfies that same interface.
Senior Real-World Use Case: Extending Standard Libraries
Embedding is best used when you want to "wrap" a type and add a little extra functionality while keeping the original behavior.
Example: A Custom Response Writer
If you’re building middleware and want to track the status code of an HTTP response, you embed the original ResponseWriter.

```go

type StatusRecorder struct {
    http.ResponseWriter // Embedding
```

    Status int
}

// You only override the WriteHeader method

```go

func (r *StatusRecorder) WriteHeader(code int) {
    r.Status = code
    r.ResponseWriter.WriteHeader(code) 
}
```


// Because of embedding, StatusRecorder still has ALL the other 
// methods of http.ResponseWriter automatically


Comparison Table
Feature
Composition (logger Logger)
Embedding (Logger)
Relationship
"Has-a" (User has a logger)
"Behaves-like" (User acts like a logger)
Access
s.logger.Log()
s.Log()
Visibility
Hidden from the outside
Publicly "promoted"
Primary Use
Injecting Dependencies
Wrapping/Extending behavior

🎯 The "Senior" Rule of Thumb
Use Composition by default. It is safer, more explicit, and follows the "Principle of Least Privilege." It prevents your structs from having 50 methods you never intended to expose.
Use Embedding only when you want the outer struct to "inherit" the API of the inner struct. If you find yourself writing ten "wrapper" methods that just call the inner struct, that's a signal to switch to embedding.






Interface, Polymerphism and Abstraction 

```go

type UserService  struct {
    credential *ClientCredential //This is Composition 
    dB     *sql.DB
}
```


What is Tight Coupling ?
Here db is tightly coupled , UserService Says it will only Use SQL db . But what if I want to integrate both redis and pgsql than? Also mock testing is hard . This is tight coupling and that’s why we use Interphase to decouple to  overcome this problem .

```go

type UserService  struct {
    credential *ClientCredential //This is Composition 
   repository     UserRepository
}
```



```go

type UserRepository interface {
```

    Save(client ClientCredentials) error
}
UserService says: “I don’t care WHAT DB you use, Just give me something that can Save” Now I canintegrate postgres and redis and other dbDecoupling means removing direct dependency on concrete implementations

```go

type ClientCredentials struct {
```

    ID     string
    Role   string

    mu     sync.RWMutex
    apiKey string
}


```go

func (c *ClientCredentials) RotateKey(newKey string) error {
    if len(newKey) < 10 {
        return errors.New("weak key")
    }
```


    c.mu.Lock()
    defer c.mu.Unlock()

    c.apiKey = newKey
    return nil
}

Abstraction means hiding implementation details behind an interface (what it does, not how).

