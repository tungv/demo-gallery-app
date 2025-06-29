"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  startTransition,
  useContext,
  useRef,
  type ComponentProps,
} from "react";

const FormRefContext =
  createContext<React.RefObject<HTMLFormElement | null> | null>(null);

export function AutoSubmitForm({
  children,
  asChild,
  ...props
}: ComponentProps<"form"> & { asChild?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  const formProps = {
    ...props,
    ref: formRef,
  };

  if (asChild) {
    return (
      <FormRefContext.Provider value={formRef}>
        <Slot {...formProps}>{children}</Slot>
      </FormRefContext.Provider>
    );
  }

  return (
    <FormRefContext.Provider value={formRef}>
      <form {...formProps}>{children}</form>
    </FormRefContext.Provider>
  );
}

export function AutoSubmitField({
  children,
  triggerPropName,
  debounceMs = 0,
}: {
  children: React.ReactNode;
  triggerPropName: string;
  debounceMs?: number;
}) {
  const formRef = useContext(FormRefContext);

  function onChange() {
    const form = formRef?.current;

    if (!form) {
      return;
    }

    startTransition(() => {
      form.requestSubmit();
    });
  }

  const props = {
    [triggerPropName]:
      debounceMs > 0 ? debounce(onChange, debounceMs) : onChange,
  };

  return <Slot {...props}>{children}</Slot>;
}

function debounce(fn: () => void, ms: number) {
  let timeout: NodeJS.Timeout;

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
}
