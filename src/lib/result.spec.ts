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
			.flatMapAsync((x) => asyncDivide(x, 5))
			.flatMapAsync((x) => asyncSqrt(x));

		const value = await sqrt2.getOrElse(always(0));
		expect(value).toBe(Math.sqrt(2));
	});

	test("should allow await at any point in the chain", async () => {
		const ten = Result.Ok(10);

		const two = await ten.flatMapAsync((x) => asyncDivide(x, 5));

		const four = two.map((x) => x * 2);

		const eight = four.mapAsync(async (x) => x * 2);
		const get = await eight.getOrElse(always(0));
		expect(get).toBe(8);
	});

	test("mapAsync", async () => {
		const ten = Result.Ok(10);
		const twenty = ten.mapAsync(async (x) => x * 2);
		const five = twenty.flatMapAsync(async (x) => asyncDivide(x, 4));
		const value = await five.getOrElse(always(0));
		expect(value).toBe(5);
	});
});
