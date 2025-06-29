"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Slot } from "@radix-ui/react-slot";
import { createContext, startTransition, useContext, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Hidden, Visible } from "../ui/reserve-layout";

const FormRefContext =
  createContext<React.RefObject<HTMLFormElement | null> | null>(null);
const FormActionContext = createContext<string | null>(null);

export function NavigationForm({
  action,
  asChild,
  children,
  ...otherProps
}: Omit<ComponentProps<"form">, "action"> & {
  action: string;
  asChild?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    // convert formData to a URLSearchParams object
    const searchParams = buildSearchParams(formData);
    const newHref = buildHref(action, searchParams);
    startTransition(() => {
      router.push(newHref);
    });
  }

  const formProps = {
    ...otherProps,
    ref: formRef,
    action: handleSubmit,
  };

  if (asChild) {
    return (
      <FormRefContext.Provider value={formRef}>
        <FormActionContext.Provider value={action}>
          <Slot {...formProps}>{children}</Slot>
        </FormActionContext.Provider>
      </FormRefContext.Provider>
    );
  }

  return (
    <FormRefContext.Provider value={formRef}>
      <FormActionContext.Provider value={action}>
        <form {...formProps}>{children}</form>
      </FormActionContext.Provider>
    </FormRefContext.Provider>
  );
}

export function NavigationButton({
  formAction,
  searchParams,
  asChild,
  children,
  ...otherProps
}: {
  formAction?: string;
  searchParams: URLSearchParams;
  children: React.ReactNode;
  asChild?: boolean;
} & Omit<ComponentProps<"button">, "formAction" | "onClick">) {
  const router = useRouter();
  const formRef = useContext(FormRefContext);
  const baseAction = useContext(FormActionContext);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    const form = formRef?.current;

    if (!form) {
      // no form
      console.warn("no form");
      return;
    }

    // get the form data
    const formData = new FormData(form);
    const searchParams = buildSearchParams(formData);

    const base = formAction ?? baseAction;
    if (!base) {
      // no base action
      console.warn("no base action");
      return;
    }

    const newHref = buildHref(base, searchParams);

    startTransition(() => {
      router.push(newHref.toString());
    });
  }

  const buttonProps = {
    ...otherProps,
    onClick: handleClick,
  };

  if (asChild) {
    return <Slot {...buttonProps}>{children}</Slot>;
  }

  return <button {...buttonProps}>{children}</button>;
}

export function NavigationSubmitMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  if (pending) {
    return <Hidden>{children}</Hidden>;
  }

  return <Visible>{children}</Visible>;
}

export function NavigationLoadingMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  if (pending) {
    return <Visible>{children}</Visible>;
  }
  return <Hidden>{children}</Hidden>;
}

function buildSearchParams(formData: FormData) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else if (typeof value === "string") {
      searchParams.append(key, value);
    } else {
      // ignore other types
    }
  }

  return searchParams;
}

function buildHref(action: string, searchParams: URLSearchParams) {
  const newHref = new URL(action, window.location.origin);
  newHref.search = searchParams.toString();
  return newHref.toString();
}
