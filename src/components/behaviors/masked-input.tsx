"use client";

import { Slot } from "@radix-ui/react-slot";
import { useLayoutEffect, useRef, useState } from "react";
import { useComposedRefs } from "@/utils/compose-refs";

export const BAD_FORMAT_ERROR = "badFormat";

export interface MaskedValue<T = string> {
  format(formatter: (value: T, src: string) => string): string;
  valid: boolean;
  value?: T;
}

export function valid<T>(value: T, src: string): MaskedValue<T> {
  return {
    format: (formatter) => formatter(value, src),
    valid: true,
    value,
  };
}

export function invalid<T>(src: string): MaskedValue<T> {
  const masked: MaskedValue<T> = {
    format: () => src,
    valid: false,
  };

  return masked;
}

function countDigitsLeft(str: string, uptoIndex: number): number {
  let digits = 0;
  const limit = Math.min(Math.max(uptoIndex, 0), str.length);
  for (let i = 0; i < limit; i++) {
    const ch = str.charAt(i);
    if (ch >= "0" && ch <= "9") digits++;
  }
  return digits;
}

function indexOfDigitCount(str: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let idx = 0;
  let seen = 0;
  while (idx < str.length && seen < digitCount) {
    const ch = str.charAt(idx);
    if (ch >= "0" && ch <= "9") seen++;
    idx++;
  }
  return idx;
}

interface MaskedInputProps<T> extends React.ComponentProps<"input"> {
  asChild?: boolean;
  defaultValue?: string;
  children?: React.ReactNode;

  format: (value: MaskedValue<T>) => string;
  parse: (value: string) => MaskedValue<T>;
}

export function MaskedInput<T>({
  asChild,
  children,
  defaultValue,
  format,
  parse,
  name,
  ref,
  onChange,
  onInvalid,
  ...props
}: MaskedInputProps<T>) {
  const [masked, setMasked] = useState<MaskedValue<T>>(
    parse(defaultValue ?? ""),
  );

  // Keep a ref to the rendered input to restore caret after formatting
  const innerInputRef = useRef<HTMLInputElement | null>(null);
  const composedRef = useComposedRefs(
    ref as unknown as React.Ref<HTMLInputElement>,
    innerInputRef,
  );

  // Plan for where to place the caret after formatting
  const caretPlanRef = useRef<{ mode: "digits" | "absolute"; value: number }>({
    mode: "digits",
    value: 0,
  });
  const userTriggeredChangeRef = useRef<boolean>(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const currentTarget = e.currentTarget;
    const raw = currentTarget.value;

    // get the current cursor position
    const cursorPosition = currentTarget.selectionStart ?? raw.length;
    userTriggeredChangeRef.current = true;

    const parsed = parse(raw);

    if (!parsed.valid) {
      currentTarget.setCustomValidity(BAD_FORMAT_ERROR);

      // When invalid, keep caret where the browser placed it after the input
      caretPlanRef.current = { mode: "absolute", value: cursorPosition };
    } else {
      currentTarget.setCustomValidity("");

      // Default plan: keep same number of digits to the left
      caretPlanRef.current = {
        mode: "digits",
        value: countDigitsLeft(raw, cursorPosition),
      };
    }
    currentTarget.reportValidity();

    setMasked(parsed);
    onChange?.(e);
  }

  function handleInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    onInvalid?.(e);
  }

  const nextValue = format(masked);

  const inputProps = {
    ...props,
    onChange: handleChange,
    onInvalid: handleInvalid,
    value: nextValue,
    "data-masked-value": nextValue,
  };

  // After updates, restore caret per the plan:
  // - "digits": keep same number of digits on the left
  // - "absolute": stick to the absolute index (invalid case)
  useLayoutEffect(() => {
    if (!userTriggeredChangeRef.current) return;
    userTriggeredChangeRef.current = false;

    const input = innerInputRef.current;
    if (!input) return;

    const plan = caretPlanRef.current;
    const caretIndex =
      plan.mode === "absolute"
        ? // in between 0 and the length of the next value
          Math.min(Math.max(plan.value, 0), nextValue.length)
        : indexOfDigitCount(nextValue, plan.value);

    try {
      input.setSelectionRange(caretIndex, caretIndex);
    } catch (_) {
      // noop: some input types may not support selection
    }
  }, [nextValue]);

  const hiddenElement = (
    <input
      type="hidden"
      readOnly
      value={masked.valid ? (masked.value as string) : ""}
      name={name}
    />
  );

  // const debuggerElement = <pre>{JSON.stringify(format(masked))}</pre>;

  if (asChild) {
    return (
      <>
        {hiddenElement}
        <Slot {...inputProps} ref={composedRef}>
          {children}
        </Slot>
        {/* {debuggerElement} */}
      </>
    );
  }

  return (
    <>
      {hiddenElement}
      <input {...inputProps} ref={composedRef} />
      {/* {debuggerElement} */}
    </>
  );
}
