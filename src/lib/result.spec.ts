import { describe, expect, test } from "bun:test";
import { Result } from "./result";

function always<const T>(value: T) {
	return () => value;
}

function identity<const T>(value: T) {
	return value;
}

describe("Result.Ok", () => {
	test("should create a Right option with a value", () => {
		const option = Result.Ok(42);
		expect(option.getOrElse(always(0))).toBe(42);
	});

	test("map should transform the Right value", () => {
		const option = Result.Ok(10);
		const result = option.map((x) => x * 2);
		expect(result.getOrElse(always(0))).toBe(20);
	});

	test("map should chain multiple transformations", () => {
		const option = Result.Ok(5);
		const result = option
			.map((x) => x * 2)
			.map((x) => x + 3)
			.map((x) => x.toString());

		const get = result.getOrElse(always(""));
		expect(get).toBe("13");
	});

	test("flatMap should flatten nested Results", () => {
		const option = Result.Ok(10);
		const result = option.flatMap((x) => Result.Ok(x * 2));
		expect(result.getOrElse(always(0))).toBe(20);
	});

	test("flatMap should propagate Left values", () => {
		const option = Result.Ok(10);
		const result = option.flatMap((x) => Result.Err("error"));
		const get = result.getOrElse(always(0));
		expect(get).toBe(0);
	});

	test("flatMap should chain multiple operations", () => {
		const divide = (a: number, b: number) =>
			b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);

		const twenty = Result.Ok(20);
		const ten = twenty.flatMap((x) => divide(x, 2));
		const two = ten.flatMap((x) => divide(x, 5));
		const get = two.getOrElse(always(0));
		expect(get).toBe(2);
	});

	test("mapErr should not affect Right values", () => {
		const option = Result.Ok(42);
		const result = option.mapErr((err: string) => `Error: ${err}`);
		expect(result.getOrElse(always(0))).toBe(42);
	});

	test("getOrElse should return the Right value", () => {
		const option = Result.Ok("success");
		expect(option.getOrElse(always("fallback"))).toBe("success");
	});
});

describe("Result.Err", () => {
	test("should create a Left option with an error", () => {
		const option = Result.Err("error");
		const fallback = option.getOrElse(always("fallback"));
		expect(fallback).toBe("fallback");
	});

	test("map should not transform Left values", () => {
		const option = Result.Err("error");
		const result = option.map((x: number) => x * 2);
		const get = result.getOrElse(always(0));
		expect(get).toBe(0);
	});

	test("map should preserve Left through multiple transformations", () => {
		const option = Result.Err("error");
		const result = option
			.map((x: number) => x * 2)
			.map((x: number) => x + 3)
			.map((x: number) => x.toString());

		const get = result.getOrElse(identity);
		expect(get).toBe("error");
	});

	test("flatMap should not execute on Left values", () => {
		const option = Result.Err("error");
		let executed = false;
		const result = option.flatMap((x: number) => {
			executed = true;
			return Result.Ok(x * 2);
		});
		expect(executed).toBe(false);
		expect(result.getOrElse(always("fallback"))).toBe("fallback");
	});

	test("mapErr should transform the Left value", () => {
		const option = Result.Err("error");
		const result = option.mapErr((err) => `Error: ${err}`);
		expect(result.getOrElse(identity)).toBe("Error: error");
	});

	test("mapErr should chain multiple transformations", () => {
		const option = Result.Err(404);
		const result = option
			.mapErr((code) => `Error code: ${code}`)
			.mapErr((msg) => msg.toUpperCase())
			.mapErr((msg) => `[${msg}]`);

		expect(result.getOrElse(identity)).toBe("[ERROR CODE: 404]");
	});

	test("getOrElse should return the Left value (acting as fallback)", () => {
		const option = Result.Err("error");
		expect(option.getOrElse(identity)).toBe("error");
	});
});

describe("Result - Real-world scenarios", () => {
	test("parsing JSON safely", () => {
		const parseJSON = (
			str: string,
		): Result<{ name: string }, `Parse error: ${string}`> => {
			try {
				return Result.Ok(JSON.parse(str));
			} catch (error) {
				return Result.Err(`Parse error: ${error}`);
			}
		};

		const validResult = parseJSON('{"name": "John"}');
		const get = validResult.getOrElse((err) => null);
		expect(get).toEqual({ name: "John" });

		const invalidResult = parseJSON("{invalid json}");
		const error = invalidResult.getOrElse(identity);
		expect(typeof error).toBe("string");
		expect(error).toContain("Parse error");
	});

	test("chaining operations with error handling", () => {
		const divide = (a: number, b: number) =>
			b === 0 ? Result.Err("Cannot divide by zero") : Result.Ok(a / b);

		const sqrt = (x: number) =>
			x < 0
				? Result.Err("Cannot take sqrt of negative")
				: Result.Ok(Math.sqrt(x));

		// Success case
		const success = Result.Ok(100)
			.flatMap((x) => divide(x, 4))
			.flatMap((x) => sqrt(x));

		expect(success.getOrElse(always(0))).toBe(5);

		// Failure case - division by zero
		const failure1 = Result.Ok(100)
			.flatMap((x) => divide(x, 0))
			.flatMap((x) => sqrt(x));
		expect(failure1.getOrElse(identity)).toBe("Cannot divide by zero");

		// Failure case - negative sqrt
		const failure2 = Result.Ok(-100)
			.flatMap((x) => divide(x, 4))
			.flatMap((x) => sqrt(x));
		expect(failure2.getOrElse(identity)).toBe("Cannot take sqrt of negative");
	});

	test("transforming error messages", () => {
		const result = Result.Err(404)
			.mapErr((code) => ({ code, message: "Not Found" }))
			.mapErr((err) => `HTTP ${err.code}: ${err.message}`);

		expect(result.getOrElse(identity)).toBe("HTTP 404: Not Found");
	});

	test("combining map and flatMap", () => {
		const getUser = (id: number) =>
			id > 0 ? Result.Ok({ id, name: `User ${id}` }) : Result.Err("Invalid ID");

		const result = Result.Ok(5)
			.map((x) => x * 2) // 10
			.flatMap((id) => getUser(id)) // Get user with id 10
			.map((user) => user.name.toUpperCase()); // Transform name

		expect(result.getOrElse(always(""))).toBe("USER 10");
	});

	test("validation pipeline", () => {
		const validateEmail = (email: string) =>
			email.includes("@")
				? Result.Ok(email)
				: Result.Err("Invalid email format");

		const validateLength = (email: string) =>
			email.length >= 5 ? Result.Ok(email) : Result.Err("Email too short");

		const validateDomain = (email: string) =>
			email.endsWith(".com")
				? Result.Ok(email)
				: Result.Err("Must be .com domain");

		// Valid email
		const valid = Result.Ok("user@example.com")
			.flatMap(validateEmail)
			.flatMap(validateLength)
			.flatMap(validateDomain);
		expect(valid.getOrElse(always(""))).toBe("user@example.com");

		// Invalid email - no @
		const invalid1 = Result.Ok("userexample.com")
			.flatMap(validateEmail)
			.flatMap(validateLength)
			.flatMap(validateDomain);

		expect(invalid1.getOrElse(identity)).toBe("Invalid email format");

		// Invalid email - wrong domain
		const invalid2 = Result.Ok("user@example.org")
			.flatMap(validateEmail)
			.flatMap(validateLength)
			.flatMap(validateDomain);

		expect(invalid2.getOrElse(identity)).toBe("Must be .com domain");
	});

	test("data fetching and parsing", async () => {
		type User = { id: number; name: string };

		async function fetchUser(id: number) {
			return id > 0
				? Result.Ok(`{"id": ${id}, "name": "User ${id}"}`)
				: Result.Err("invalid_id");
		}

		function parseUser(json: string) {
			return Result.tryCatch<User>(() => JSON.parse(json)).mapErr(
				always("parse_error"),
			);
		}

		const userId = Result.Ok(10);

		const json = userId.flatMap(fetchUser);
		const user = json.flatMap(parseUser);

		const value = await user.getOrElse(always(null));

		expect(value).toEqual({ id: 10, name: "User 10" });
	});
});

describe("Result - Type safety", () => {
	test("should maintain type information through transformations", () => {
		const option = Result.Ok(42);
		const result = option.map((x) => x.toString()).map((str) => str.length);

		// TypeScript should infer this as Result<number, never>
		expect(typeof result.getOrElse(always(0))).toBe("number");
	});

	test("should handle different Left types", () => {
		type ValidationError = { field: string; message: string };

		const error: ValidationError = { field: "email", message: "Invalid" };
		const option = Result.Err(error);

		const result = option.mapErr((err) => `${err.field}: ${err.message}`);
		expect(result.getOrElse(identity)).toBe("email: Invalid");
	});
});

describe("Result - Async", () => {
	async function asyncDivide(a: number, b: number) {
		return b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);
	}

	async function asyncSqrt(x: number) {
		return x < 0
			? Result.Err("Cannot take sqrt of negative")
			: Result.Ok(Math.sqrt(x));
	}

	test("should handle async operations", async () => {
		const ten = Result.Ok(10);

		const sqrt2 = ten
			.flatMap((x) => asyncDivide(x, 5))
			.flatMap((x) => asyncSqrt(x));

		const value = await sqrt2.getOrElse(always(0));
		expect(value).toBe(Math.sqrt(2));
	});

	test("should allow await at any point in the chain", async () => {
		const ten = Result.Ok(10);

		const two = await ten.flatMap((x) => asyncDivide(x, 5));

		const four = two.map((x) => x * 2);

		const eight = four.map(async (x) => x * 2);
		const get = await eight.getOrElse(always(0));
		expect(get).toBe(8);
	});

	test("async map", async () => {
		const ten = Result.Ok(10);
		const twenty = ten.map(async (x: number) => x * 2);

		const five = twenty.flatMap((x: number) => asyncDivide(x, 4));
		const value = await five.getOrElse(always(0));
		expect(value).toBe(5);
	});

	test("generic flatMap with sync callback returns Result", () => {
		const divide = (a: number, b: number) =>
			b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);

		const ten = Result.Ok(10);
		const five = ten.flatMap((x) => divide(x, 2));

		// Should be a regular Result, not a ThenableResult
		// This should work synchronously
		const value = five.getOrElse(always(0));
		expect(value).toBe(5);
	});

	test("generic flatMap with async callback returns ThenableResult", async () => {
		const ten = Result.Ok(10);
		const five = ten.flatMap((x) => asyncDivide(x, 2));

		// Should be a ThenableResult since asyncDivide returns Promise<Result>
		// This means we can await it
		const result = await five;
		const value = result.getOrElse(always(0));
		expect(value).toBe(5);
	});

	test("generic flatMap can chain sync and async operations", async () => {
		const divide = (a: number, b: number) =>
			b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);

		const hundred = Result.Ok(100);

		// Start with sync flatMap
		const fifty = hundred.flatMap((x) => divide(x, 2));

		// Chain with async flatMap
		const five = fifty.flatMap((x) => asyncDivide(x, 10));

		// Chain with another sync flatMap (after async, returns ThenableResult)
		const one = five.flatMap((x) => divide(x, 5));

		// Since we used async flatMap in the chain, we need to await
		const result = await one;
		const value = result.getOrElse(always(0));
		expect(value).toBe(1);
	});

	test("generic flatMap in ThenableResult with sync callback", async () => {
		const divide = (a: number, b: number) =>
			b === 0 ? Result.Err("Division by zero") : Result.Ok(a / b);

		const ten = Result.Ok(10);

		// Start with async to get ThenableResult
		const five = ten.flatMap((x) => asyncDivide(x, 2));

		// Use sync callback on ThenableResult
		const one = five.flatMap((x) => divide(x, 5));

		const result = await one;
		const value = result.getOrElse(always(0));
		expect(value).toBe(1);
	});

	test("generic flatMap in ThenableResult with async callback", async () => {
		const ten = Result.Ok(10);

		// Start with async to get ThenableResult
		const five = ten.flatMap((x) => asyncDivide(x, 2));

		// Use async callback on ThenableResult
		const sqrt5 = five.flatMap((x) => asyncSqrt(x));

		const result = await sqrt5;
		const value = result.getOrElse(always(0));
		expect(value).toBeCloseTo(Math.sqrt(5));
	});

	test("generic map with sync callback returns Result", () => {
		const ten = Result.Ok(10);
		const twenty = ten.map((x) => x * 2);

		// Should be a regular Result, not a ThenableResult
		// This should work synchronously
		const value = twenty.getOrElse(always(0));
		expect(value).toBe(20);
	});

	test("generic map with async callback returns ThenableResult", async () => {
		const ten = Result.Ok(10);
		const twenty = ten.map(async (x: number) => x * 2);

		// Should be a ThenableResult since callback returns Promise
		// This means we can await it
		const result = await twenty;

		expect(result.getOrElse(always(0))).toBe(20);
	});

	test("generic map can chain sync and async operations", async () => {
		const ten = Result.Ok(10);

		// Start with sync map
		const twenty = ten.map((x) => x * 2);

		// Chain with async map
		const forty = twenty.map(async (x: number) => x * 2);

		// Chain with another sync map (after async, returns ThenableResult)
		const eighty = forty.map((x: number) => x * 2);

		// Since we used async map in the chain, we need to await
		const result = await eighty;
		const value = result.getOrElse(always(0));
		expect(value).toBe(80);
	});

	test("generic map in ThenableResult with sync callback", async () => {
		const ten = Result.Ok(10);

		// Start with async to get ThenableResult
		const twenty = ten.map(async (x: number) => x * 2);

		// Use sync callback on ThenableResult
		const forty = twenty.map((x: number) => x * 2);

		const result = await forty;
		expect(result.getOrElse(always(0))).toBe(40);
	});

	test("generic map in ThenableResult with async callback", async () => {
		const ten = Result.Ok(10);

		// Start with async to get ThenableResult
		const twenty = ten.map(async (x: number) => x * 2);

		// Use async callback on ThenableResult
		const forty = twenty.map(async (x: number) => x * 2);

		const result = await forty;

		const get = result.getOrElse(always(0));

		expect(get).toBe(40);
	});

	test("mixing generic map and flatMap with async", async () => {
		const hundred = Result.Ok(100);

		// Start with sync map
		const fifty = hundred.map((x) => x / 2);

		// Chain with async flatMap
		const five = fifty.flatMap((x: number) => asyncDivide(x, 10));

		// Chain with sync map (stays async)
		const ten = five.map((x: number) => x * 2);

		// Chain with async map
		const twenty = ten.map(async (x: number) => x * 2);

		const result = await twenty;

		expect(result.getOrElse(always(0))).toBe(20);
	});
});

describe("Result.all", () => {
	test("should return Ok if all results are Ok", () => {
		const results = [Result.Ok(1), Result.Ok(2), Result.Ok(3)];
		const result = Result.all(results);
		const array = result.getOrElse(always([]));
		expect(array).toEqual([1, 2, 3]);
	});

	test("should return Err if any result is Err", () => {
		const results = [
			Result.Ok(1),
			Result.Err("error_1"),
			Result.Ok(3),
			Result.Err("error_2"),
		];
		const result = Result.all(results);
		const error = result.getOrElse((err) => err);

		// we know that error is an AggregatedError
		const aggregatedError = error as Result.AggregatedResultError<any>;

		expect(aggregatedError.message).toBe("AggregatedResultError");
		expect(aggregatedError.getErrors()).toEqual(["error_1", "error_2"]);
	});
});
