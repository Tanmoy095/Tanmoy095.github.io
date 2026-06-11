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

| Feature      | Composition (logger Logger) | Embedding (Logger)                       |
| ------------ | --------------------------- | ---------------------------------------- |
| Relationship | "Has-a" (User has a logger) | "Behaves-like" (User acts like a logger) |
| Access       | s.logger.Log()              | s.Log()                                  |
| Visibility   | Hidden from the outside     | Publicly "promoted"                      |
| Primary Use  | Injecting Dependencies      | Wrapping/Extending behavior              |

🎯 The "Senior" Rule of Thumb
- Use Composition by default. It is safer, more explicit, and follows the "Principle of Least Privilege." It prevents your structs from having 50 methods you never intended to expose.
- Use Embedding only when you want the outer struct to "inherit" the API of the inner struct. If you find yourself writing ten "wrapper" methods that just call the inner struct, that's a signal to switch to embedding.






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


type UserRepository interface {

    Save(client ClientCredentials) error
}
UserService says: “I don’t care WHAT DB you use, Just give me something that can Save” Now I canintegrate postgres and redis and other dbDecoupling means removing direct dependency on concrete implementations


type ClientCredentials struct {

    ID     string
    Role   string

    mu     sync.RWMutex
    apiKey string
}



func (c *ClientCredentials) RotateKey(newKey string) error {
    if len(newKey) < 10 {
        return errors.New("weak key")
    }

    c.mu.Lock()
    defer c.mu.Unlock()

    c.apiKey = newKey
    return nil
}

Abstraction means hiding implementation details behind an interface (what it does, not how).

