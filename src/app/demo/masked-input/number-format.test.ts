import { expect, test, describe } from "bun:test";

import { format, parse } from "./number-format";
import { valid } from "@/components/behaviors/masked-input";

describe("parse(string)", () => {
	describe("valid", () => {
		test("valid number", () => {
			expect(parse("1234.56").value).toBe(1234.56);
		});

		test("valid number with negative sign", () => {
			expect(parse("-1234.56").value).toBe(-1234.56);
		});

		test("valid number with positive sign", () => {
			expect(parse("+1234.56").value).toBe(1234.56);
		});

		test("valid number with no integer part", () => {
			expect(parse(".56").value).toBe(0.56);
		});

		test("scientific notation", () => {
			expect(parse("1.23e+5").value).toBe(123000);
		});
		test("bigint", () => {
			expect(parse("12345678901234567890").value).toBe(
				BigInt("12345678901234567890"),
			);
		});
	});

	describe("invalid", () => {
		test("invalid number", () => {
			expect(parse("1234.56a").format(String)).toBe("1234.56a");
		});

		test("invalid number with multiple decimal separators", () => {
			expect(parse("1234.56.78").format(String)).toBe("1234.56.78");
		});

		test("invalid number with no decimal part", () => {
			expect(parse("1234.").format(String)).toBe("1234.");
		});

		test("multiple signs", () => {
			expect(parse("--1234.56").format(String)).toBe("--1234.56");
		});

		test("infinity", () => {
			expect(parse("Infinity").format(String)).toBe("Infinity");
		});

		test("negative infinity", () => {
			expect(parse("-Infinity").format(String)).toBe("-Infinity");
		});

		test("NaN", () => {
			expect(parse("NaN").format(String)).toBe("NaN");
		});
	});

	describe("incomplete", () => {
		test("negative sign", () => {
			expect(parse("-").format(String)).toBe("-");
		});

		test("negative sign and decimal separator", () => {
			expect(parse("-.").format(String)).toBe("-.");
		});

		test("scientific notation", () => {
			expect(parse("1.23e").format(String)).toBe("1.23e");
		});
	});
});

describe("format(value)", () => {
	test("number", () => {
		const masked = valid(1234.56, "1234.56");
		expect(format(masked)).toBe("1,234.56");
	});

	test("bigint", () => {
		const masked = valid(
			BigInt("12345678901234567890"),
			"12345678901234567890",
		);
		expect(format(masked)).toBe("12,345,678,901,234,567,890");
	});

	test("intentional zero", () => {
		const masked = valid(0, "0");
		expect(format(masked)).toBe("0");
	});

	test("empty", () => {
		const masked = valid(0, "");
		expect(format(masked)).toBe("");
	});

	test("negative number", () => {
		const masked = valid(-1234.56, "-1234.56");
		expect(format(masked)).toBe("-1,234.56");
	});

	test("negative bigint", () => {
		const masked = valid(
			BigInt("-12345678901234567890"),
			"-12345678901234567890",
		);
		expect(format(masked)).toBe("-12,345,678,901,234,567,890");
	});

	test("negative zero", () => {
		const masked = valid(-0, "-0");
		expect(format(masked)).toBe("0");
	});

	test("negative empty", () => {
		const masked = valid(-0, "");
		expect(format(masked)).toBe("");
	});
});
