"use client";

import {
  invalid,
  valid,
  type MaskedValue,
} from "@/components/behaviors/masked-input";

export function parse(str: string): MaskedValue<number | bigint> {
  // value is a formatted string (eg: 1,234.56 or 3.210,4) depending on the locale, we need to parse it to a number

  const trimmedStr = str.trim();

  // if the string is empty
  if (trimmedStr === "") {
    return valid(0, trimmedStr);
  }

  if (trimmedStr === "-") {
    return invalid("-");
  }

  // if the string has alphabetic characters
  if (trimmedStr.match(/[a-zA-Z]/)) {
    // except for the scientific notation (e.g. 1.23e+5) we don't need to handle bigints here as it's a float anyway
    if (trimmedStr.match(/^\-?[0-9]+\.?[0-9]*[eE][+-]?[0-9]+$/)) {
      return parseDecimalString(Number.parseFloat(str).toString());
    }

    return invalid(trimmedStr);
  }

  return parseDecimalString(trimmedStr);
}

function parseDecimalString(str: string): MaskedValue<number | bigint> {
  // first we need to detect the decimal separator by heuristic
  const decimalSeparator = getDecimalSeparator();

  // check negative sign
  const sign = str[0] === "-" ? -1 : 1;

  // validate if the decimal separator is consistent (it must be at most one per string)
  const decimalSeparatorCount = str.split(decimalSeparator).length - 1;

  if (decimalSeparatorCount > 1) {
    return invalid(str);
  }

  const [integerPart, decimalPart = ""] = str.split(decimalSeparator);

  if (decimalSeparatorCount === 1 && decimalPart === "") {
    return invalid(str);
  }

  const integerPartCleaned = integerPart.replaceAll(/[^\d\-]/g, "");
  const decimalPartCleaned = decimalPart.replaceAll(/[^\d]/g, "");

  // check if we need to use bigint
  const isBigInt = integerPartCleaned.length > 15 && decimalPartCleaned === "";

  const value = isBigInt
    ? BigInt(integerPartCleaned)
    : Number(integerPartCleaned) +
      (decimalPartCleaned === "" ? 0 : Number(`0.${decimalPartCleaned}`)) *
        sign;

  if (Number.isNaN(value)) {
    return invalid(str);
  }

  return valid(value, str);
}

const fmt = new Intl.NumberFormat("en-US");

export function format(value: MaskedValue<number | bigint>): string {
  return value.format((num, src) => {
    const isZero = num === 0 || num === BigInt(0) || Object.is(num, -0);
    if (isZero) {
      return src === "" ? "" : "0";
    }

    return fmt.format(num);
  });
}

function getDecimalSeparator(): "." | "," {
  const formatted = fmt.format(1.1);

  const decimalSeparator = formatted.at(1);

  if (decimalSeparator === ",") {
    return ",";
  }

  return ".";
}
