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
import { Result } from "@/lib/result";

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

## Advanced Patterns

### Result.fromCallback - Wrapping Functions That Might Throw

Safely wraps any function that might throw exceptions, converting it into a Result. Supports both synchronous and asynchronous functions.

**Features:**

- ✅ Wraps sync functions that might throw
- ✅ Wraps async functions that might throw or reject
- ✅ Type-safe error handling
- ✅ Returns `Result<T, E>` for sync functions
- ✅ Returns `FutureResult<T, E>` for async functions

**Type Signature:**

```typescript
Result.fromCallback<RetType, ErrType = Error>(
  fn: () => RetType
): RetType extends Promise<infer AsyncRetType>
  ? FutureResult<AsyncRetType, ErrType>
  : Result<RetType, ErrType>
```

**Examples:**

```typescript
// Synchronous function
function riskyFunction(): string {
  if (Math.random() > 0.5) {
    throw new Error("Random failure!");
  }
  return "Success!";
}

const result = Result.fromCallback(riskyFunction);
// Result<string, Error>

// Asynchronous function
async function riskyAsyncFunction(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (Math.random() > 0.5) {
    throw new Error("Async failure!");
  }
  return "Async Success!";
}

const asyncResult = Result.fromCallback(riskyAsyncFunction);
// FutureResult<string, Error>

const value = await asyncResult.getOrElse(() => "fallback");
```

**JSON Parsing Example:**

```typescript
// Safe JSON parsing with specific error type
const parseJSON = <T>(str: string): Result<T, string> =>
  Result.fromCallback<T, string>(() => JSON.parse(str));

const valid = parseJSON('{"name": "John"}');
console.log(valid.getOrElse(() => null)); // {name: "John"}

const invalid = parseJSON("{invalid json}");
console.log(invalid.getOrElse((err) => "Parse failed")); // "Parse failed"
```

**Async API Call Example:**

```typescript
async function fetchUserData(id: number) {
  const result = Result.fromCallback(async () => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  });

  return result.getOrElse(() => null);
}
```

### Result.fromPromise - Converting Promises to Results

Converts a Promise into a Result, handling both resolved values and rejections. Perfect for working with existing Promise-based APIs.

**Features:**

- ✅ Converts Promise resolve to `Ok`
- ✅ Converts Promise reject to `Err`
- ✅ Works seamlessly with existing Promise-based APIs
- ✅ Returns `FutureResult<T, E>`

**Type Signature:**

```typescript
Result.fromPromise<OkType, ErrType = Error>(
  promise: Promise<OkType>
): FutureResult<OkType, ErrType>
```

**Examples:**

```typescript
// Basic promise handling
const promise = Promise.resolve(42);
const result = Result.fromPromise(promise);
// FutureResult<number, Error>

const value = await result.getOrElse(() => 0); // 42

// Handling rejection
const failedPromise = Promise.reject(new Error("Network error"));
const failedResult = Result.fromPromise<number>(failedPromise);

const error = await failedResult.getOrElse((err) => err);
// Error: Network error
```

**Fetch API Example:**

```typescript
// Converting fetch to Result
async function fetchUser(id: number) {
  const fetchPromise = fetch(`/api/users/${id}`).then((res) => res.json());

  const result = Result.fromPromise(fetchPromise);

  return result.getOrElse((err) => null);
}

// Usage
const user = await fetchUser(123);
```

**Multiple Promises Example:**

```typescript
async function combineData() {
  const promise1 = fetch("/api/data1").then((r) => r.json());
  const promise2 = fetch("/api/data2").then((r) => r.json());

  const result1 = Result.fromPromise(promise1);
  const result2 = Result.fromPromise(promise2);

  // Combine results
  const combined = (await result1).flatMap((data1) =>
    result2.map((data2) => ({ data1, data2 })),
  );

  return combined.getOrElse(() => null);
}
```

**Custom Error Types:**

```typescript
type ApiError = { status: number; message: string };

async function callApi<T>(url: string): Promise<Result<T, ApiError>> {
  const promise = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }
      return response.json();
    })
    .catch((err) => {
      throw err;
    });

  return Result.fromPromise<T, ApiError>(promise);
}
```

### Choosing Between fromCallback and fromPromise

Here's a quick guide on when to use each method:

| Scenario                        | Use            | Example                                            |
| ------------------------------- | -------------- | -------------------------------------------------- |
| Function that might throw       | `fromCallback` | `Result.fromCallback(() => JSON.parse(str))`       |
| Async function that might throw | `fromCallback` | `Result.fromCallback(async () => await riskyOp())` |
| Existing Promise instance       | `fromPromise`  | `Result.fromPromise(fetchPromise)`                 |
| Third-party Promise API         | `fromPromise`  | `Result.fromPromise(fetch('/api/data'))`           |

**Visual Comparison:**

```typescript
// Scenario 1: Wrapping a throwing function
// Use fromCallback - it executes the function
const result1 = Result.fromCallback(() => {
  if (invalid) throw new Error("Invalid");
  return value;
});

// Scenario 2: Already have a Promise
// Use fromPromise - the promise is already running
const promise = fetch("/api/data");
const result2 = Result.fromPromise(promise);

// Scenario 3: Async operation that might throw
// Use fromCallback - it handles both throws and rejections
const result3 = Result.fromCallback(async () => {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error("Failed");
  return response.json();
});

// Scenario 4: Chain of promises
// Use fromPromise - clean conversion
const result4 = Result.fromPromise(
  fetch("/api/data")
    .then((r) => r.json())
    .then((data) => data.user),
);
```

## Real-World Examples

### JSON Parsing

```typescript
function parseJSON(str: string): Result<{ name: string }, string> {
  return Result.fromCallback(() => JSON.parse(str)).mapErr(() => "parse_error");
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

### API Call with Error Handling

```typescript
async function getUserProfile(id: number) {
  // Using fromPromise
  const fetchResult = Result.fromPromise(
    fetch(`/api/users/${id}`).then((r) => r.json()),
  );

  // Using fromCallback
  const parseResult = Result.fromCallback(async () => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  });

  return parseResult.getOrElse(() => null);
}
```

### Combining Multiple Promises

```typescript
async function loadDashboard() {
  const userData = Result.fromPromise(fetch("/api/user").then((r) => r.json()));
  const settingsData = Result.fromPromise(
    fetch("/api/settings").then((r) => r.json()),
  );

  const combined = (await userData).flatMap((user) =>
    settingsData.map((settings) => ({ user, settings })),
  );

  return combined.getOrElse(() => null);
}
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
import { Result } from "@/lib/result";

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

## Static Methods

The Result utility provides several static methods for working with collections of Results:

### Result.all

Combines multiple Results into a single Result. If all results are successful, returns `Ok` containing an array of all values. If any result fails, returns `Err` with an `AggregatedResultError` containing all the error values (successful values are ignored).

```typescript
// All results are successful
const results = [Result.Ok(1), Result.Ok(2), Result.Ok(3)];
const combined = Result.all(results);
// Result.Ok([1, 2, 3])

// Some results failed
const mixedResults = [Result.Ok(1), Result.Err("error_1"), Result.Ok(3)];
const combinedWithErrors = Result.all(mixedResults);
// Result.Err(AggregatedResultError(["error_1"])) - only collects errors, ignores successful values

// Empty array - always successful
const empty = Result.all([]);
// Result.Ok([])
```

### Result.every

Returns `true` if all Results in the collection are successful (`Ok`), `false` otherwise.

```typescript
const results = [Result.Ok(1), Result.Ok(2), Result.Ok(3)];
const allSuccessful = Result.every(results); // true

const mixedResults = [Result.Ok(1), Result.Err("error"), Result.Ok(3)];
const notAllSuccessful = Result.every(mixedResults); // false

const allErrors = [Result.Err("error1"), Result.Err("error2")];
const noSuccess = Result.every(allErrors); // false
```

### Result.some

Returns `true` if at least one Result in the collection is successful (`Ok`), `false` if all are errors.

```typescript
const results = [Result.Err("error1"), Result.Ok(2), Result.Err("error3")];
const hasSuccess = Result.some(results); // true

const allErrors = [Result.Err("error1"), Result.Err("error2")];
const noSuccess = Result.some(allErrors); // false

const allSuccess = [Result.Ok(1), Result.Ok(2)];
const allHaveSuccess = Result.some(allSuccess); // true
```

### Working with Async Operations

These static methods work seamlessly with both synchronous and asynchronous Results:

```typescript
async function example() {
  // Mix of sync and async results
  const results = [
    Result.Ok(1),
    fetchDataAsync(), // Returns FutureResult<number, string> or Promise<Result<number, string>>
    Result.Ok(3),
  ];

  // Wait for all async operations to complete
  const resolvedResults = await Promise.all(results);

  // Then combine them
  const combined = Result.all(resolvedResults);
  const final = await combined.getOrElse((err) => []);

  return final; // [1, fetchedData, 3] or error array
}
```

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

## Migration Guide

### Result.tryCatch (Deprecated)

> **Note:** `Result.tryCatch` is deprecated. Use `Result.fromCallback` instead, which provides the same functionality with support for async functions.

If you're using `Result.tryCatch`, you can migrate at your own pace:

1. **No immediate action required** - `tryCatch` still works
2. **When updating code** - Replace `tryCatch` with `fromCallback`
3. **For new code** - Use `fromCallback` or `fromPromise` as appropriate

```typescript
// Old way (still works but deprecated)
const result = Result.tryCatch(() => JSON.parse(jsonString));

// New way (recommended)
const result = Result.fromCallback(() => JSON.parse(jsonString));
```

## Test Coverage

All functionality is fully tested with comprehensive test suites:

- ✅ 10 tests for `fromCallback` (sync and async scenarios)
- ✅ 9 tests for `fromPromise` (resolved, rejected, and chaining scenarios)
- ✅ All 68 tests passing

## Version History

**Version:** 1.1.0  
**Date:** October 21, 2025

### What's New in v1.1.0

- ✅ Added `Result.fromCallback()` for wrapping functions that might throw
- ✅ Added `Result.fromPromise()` for converting promises to results
- ✅ Deprecated `Result.tryCatch()` (still functional for backward compatibility)
- ✅ Full async support for both new methods
- ✅ Comprehensive test coverage

### Breaking Changes

**None.** This is a backward-compatible update. All existing code will continue to work.

---

This Result utility provides a robust foundation for type-safe error handling in TypeScript applications, especially useful in complex business logic where multiple failure modes need to be handled gracefully.
