---
title: "Go Generics & Type Constraints"
date: "2026-06-10"
category: "Go"
tags: ["Go", "Generics", "Type Safety"]
isADR: false
---

Mastered Go generics syntax and type constraints, enabling reusable algorithms while maintaining compile-time type safety.

### Key Learnings:
- **Type Parameters:** Written in square brackets (e.g., `[T any]`) before parameter lists.
- **Constraints:** Define what types are allowed. Standard constraints are in the `golang.org/x/exp/constraints` package (like `Ordered` for `<` and `>` comparisons).
- **The `any` constraint:** An alias for `interface{}`.
- **The `comparable` constraint:** A built-in interface that allows operations like `==` and `!=`.
- **Underlying types:** Using the `~` symbol (e.g., `~int` matches any custom type whose underlying type is `int`).

### Real-World Code Example
```go
package generics

// MapKeys returns a slice of all keys in a map.
// Keys must be comparable, and values can be any type.
func MapKeys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```
This utility function works on maps of strings to ints, ints to floats, or any comparable key, eliminating duplicate helper functions!
