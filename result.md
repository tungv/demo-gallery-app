# Result Utility - Type-Safe Error Handling

## Overview

The `Result<OkType, ErrType>` utility provides a type-safe alternative to exception-based error handling. Inspired by functional programming languages like Rust and Haskell, it represents either a successful value (`Ok`) or an error value (`Err`), eliminating the need for try-catch blocks in many scenarios.

## Core Concepts

### Result Types

```typescript
// Success case - contains a value of type T
Result.Ok<T>(value: T): Result<T, never>

// Error case - contains an error of type E
Result.Err<E>(error: E): Result<never, E>

// General result type
Result<OkType, ErrType>
```

### Key Methods

- **`map(fn)`**: Transform the success value if present (support both sync and async callbacks)
- **`flatMap(fn)`**: Transform and flatten nested Results (support both sync and async callbacks)
- **`mapErr(fn)`**: Transform the error value if present
- **`getOrElse(fn)`**: Extract value or provide fallback

## Basic Usage

### Creating Results

```typescript
import { Result } from "./result";

// Success case
const success = Result.Ok(42);
console.log(success.getOrElse(() => 0)); // 42

// Error case
const error = Result.Err("Something went wrong");
console.log(error.getOrElse(() => 0)); // 0
```

### Transforming Values

```typescript
const result = Result.Ok(10);

// Transform success value
const doubled = result.map((x) => x * 2);
console.log(doubled.getOrElse(() => 0)); // 20

// Chain transformations
const final = result
  .map((x) => x * 2) // 20
  .map((x) => x + 3) // 23
  .map((x) => x.toString()); // "23"

console.log(final.getOrElse(() => "")); // "23"
```

### Error Transformation

```typescript
const result = Result.Err(404);

// Transform error (doesn't affect success values)
const transformed = result.mapErr((code) => `Error: ${code}`);
console.log(transformed.getOrElse((err) => err)); // "Error: 404"
```

## Real-World Examples

### JSON Parsing

```typescript
function parseJSON(str: string): Result<{ name: string }, string> {
  return Result.tryCatch(() => JSON.parse(str)).mapErr(() => "parse_error");
}

const valid = parseJSON('{"name": "John"}');
console.log(valid.getOrElse(() => null)); // {name: "John"}

const invalid = parseJSON("{invalid json}");
console.log(invalid.getOrElse((err) => err)); // "parse_error"
```

### Validation Pipeline

```typescript
const validateEmail = (email: string) =>
  email.includes("@") ? Result.Ok(email) : Result.Err("Invalid email format");

const validateLength = (email: string) =>
  email.length >= 5 ? Result.Ok(email) : Result.Err("Email too short");

const validateDomain = (email: string) =>
  email.endsWith(".com") ? Result.Ok(email) : Result.Err("Must be .com domain");

// Chain validations
const result = Result.Ok("user@example.com")
  .flatMap(validateEmail)
  .flatMap(validateLength)
  .flatMap(validateDomain);

// result has type of Result<string, "Invalid email format" | "Email too short" | "Must be .com domain">

console.log(result.getOrElse((err) => err)); // "user@example.com"
```

### Mathematical Operations with Error Handling

```typescript
const divide = (a: number, b: number) =>
  b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);

const sqrt = (x: number) =>
  x < 0 ? Result.Err("Cannot take sqrt of negative") : Result.Ok(Math.sqrt(x));

// Success case
const success = Result.Ok(100)
  .flatMap((x) => divide(x, 4)) // Ok(25)
  .flatMap((x) => sqrt(x)); // Ok(5)

console.log(success.getOrElse(() => 0)); // 5

// Error case - division by zero
const error1 = Result.Ok(100)
  .flatMap((x) => divide(x, 0)) // Err("Division by zero")
  .flatMap((x) => sqrt(x));

console.log(error1.getOrElse((err) => err)); // "Division by zero"
```

## Async Operations

### Creating Async Results

```typescript
// Async function returning Result
async function fetchUser(id: number) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return Result.Ok(user);
  } catch (error) {
    return Result.Err(`Failed to fetch user: ${error}`);
  }
}

// Using async Results
const userResult = await Result.Ok(123).flatMap((id) => fetchUser(id));

const user = userResult.getOrElse(() => null);
```

### Mixing Sync and Async

```typescript
// Start with sync operation
const baseValue = Result.Ok(100);

// Mix sync and async operations
const result = await baseValue
  .map((x) => x / 2) // Sync: Ok(50)
  .flatMap((x) => asyncDivide(x, 10)) // Async: ThenableResult<number, string>
  .map((x) => x * 2); // Sync on ThenableResult: ThenableResult<number, string>

const final = result.getOrElse(() => 0);
console.log(await final); // 10
```

## Type Safety Features

### Conditional Types

The utility uses advanced TypeScript features for precise type inference:

```typescript
import { Result } from "./result";

// Type-level operations preserve type information
const result: Result.MustOk<string> = Result.Ok("hello");
const length = result.map((s) => s.length); // Result.MustOk<number>
```

### Error Type Transformation

```typescript
type ValidationError = { field: string; message: string };

const error: ValidationError = { field: "email", message: "Invalid" };
const result = Result.Err(error);

// Transform error type
const userFriendly = result.mapErr((err) => `${err.field}: ${err.message}`);
const message = userFriendly.getOrElse((err) => err); // "email: Invalid"
```

## Advanced Patterns

### Result.tryCatch

```typescript
// Wrap any function that might throw
function riskyFunction(): string {
  if (Math.random() > 0.5) {
    throw new Error("Random failure!");
  }
  return "Success!";
}

const result = Result.tryCatch(riskyFunction);
// Result<string, Error>
```

### Combining Multiple Results

```typescript
function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  for (const result of results) {
    if (result.isErr) {
      return result; // Early return on first error
    }
  }
  // All results are Ok, combine values
  return Result.Ok(results.map((r) => r.value));
}
```

## Comparison with Alternatives

### vs Try-Catch

**Result approach:**

```typescript
const result = riskyOperation()
  .map((x) => x * 2)
  .getOrElse(() => 0);
```

**Try-catch approach:**

```typescript
let result;
try {
  const value = riskyOperation();
  result = value * 2;
} catch (error) {
  result = 0;
}
```

### vs Promises

**Result handles both sync and async uniformly:**

```typescript
// Works the same for sync and async
const value = await myResult.getOrElse(() => defaultValue);
```

## Best Practices

1. **Use descriptive error types** instead of generic `string` or `Error`
2. **Chain operations** rather than nesting conditionals
3. **Transform errors** at boundaries to user-friendly messages
4. **Use `flatMap` for operations that return Results**
5. **Use `map` for simple value transformations**

## Common Patterns

### Railway Oriented Programming

```typescript
// Each function returns Result<T, E>
const processData = (input: string) =>
  Result.Ok(input).map(trim).flatMap(validate).flatMap(transform).flatMap(save);

const result = processData("  input  ");
```

### Error Accumulation

```typescript
// Collect all validation errors instead of failing fast
const validateAll = (email: string) => {
  const errors: string[] = [];

  if (!email.includes("@")) errors.push("Missing @");
  if (email.length < 5) errors.push("Too short");
  if (!email.endsWith(".com")) errors.push("Must be .com");

  return errors.length === 0 ? Result.Ok(email) : Result.Err(errors.join(", "));
};
```

This Result utility provides a robust foundation for type-safe error handling in TypeScript applications, especially useful in complex business logic where multiple failure modes need to be handled gracefully.
