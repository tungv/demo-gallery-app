"use client";

import { Slot } from "@radix-ui/react-slot";
import { type RefObject, useRef, useState } from "react";

type MaskedValueProps = {
  "data-masked-value": string;
};

export interface MaskedValue<T = string> {
  format(formatter: (value: T, src: string) => string): string;
  props(): MaskedValueProps;
  valid: boolean;
  value?: T;
}

export function valid<T>(value: T, src: string): MaskedValue<T> {
  return {
    format: (formatter) => formatter(value, src),
    valid: true,
    props: () =>
      ({
        "data-masked-value": src,
      }) as const,
    value,
  };
}

export function invalid<T>(src: string): MaskedValue<T> {
  const masked: MaskedValue<T> = {
    format: () => src,
    valid: false,
    props: () =>
      ({
        "data-masked-value": src,
      }) as const,
  };

  return masked;
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const currentTarget = e.currentTarget;
    const raw = currentTarget.value;

    const parsed = parse(raw);

    if (!parsed.valid) {
      currentTarget.setCustomValidity("badFormat");
      currentTarget.reportValidity();
    } else {
      currentTarget.setCustomValidity("");
      currentTarget.reportValidity();
    }

    setMasked(parsed);
    onChange?.(e);
  }

  function handleInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    onInvalid?.(e);
  }

  const inputProps = {
    ...props,
    onChange: handleChange,
    onInvalid: handleInvalid,
    value: format(masked),
    ...masked.props(),
  };

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
        <Slot {...inputProps} ref={ref}>
          {children}
        </Slot>
        {/* {debuggerElement} */}
      </>
    );
  }

  return (
    <>
      {hiddenElement}
      <input {...inputProps} ref={ref} />
      {/* {debuggerElement} */}
    </>
  );
}
