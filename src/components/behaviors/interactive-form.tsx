"use client";

import { Slot } from "@radix-ui/react-slot";
import { redirect } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import type { ComponentProps, ReactNode } from "react";
import { createReducerContext } from "@/utils/reducer-context";
import { cn } from "@/lib/utils";
import { Hidden, Visible } from "../ui/reserve-layout";

export interface InteractiveFormResult<ResultType, ErrorType extends string> {
  redirect?: string;
  /*
    errors is a record of field names and their errors
    this is useful for displaying errors for specific fields
    and for clearing errors when the form is reset
  */
  errors?: {
    [fieldName: string]: string[];
  };
  result?: ResultType;
  nextElement?: ReactNode;
}

type LocalState<ResultType, ErrorType extends string> = {
  errors?: {
    [fieldName: string]: string[];
  };
  result?: ResultType;
  nextElement?: ReactNode;
  counter: number;
};

const NO_RESULT = Symbol("NO_RESULT");

// biome-ignore lint/suspicious/noExplicitAny: we don't care about the types here
const initialState: LocalState<any, any> = {
  errors: {},
  result: NO_RESULT,
  counter: 0,
};

type FormAction<ResultType, ErrorType extends string> =
  | {
      type: "set_form_result";
      result: InteractiveFormResult<ResultType, ErrorType>;
    }
  | { type: "clear_field_error"; fieldName: string }
  | { type: "reset_form" };

const [FormStateProvider, useFormState, useFormDispatch] = createReducerContext<
  FormAction<unknown, string>,
  LocalState<unknown, string>
>((state, action) => {
  switch (action.type) {
    case "set_form_result":
      if (action.result.errors) {
        return {
          ...state,
          errors: action.result.errors,
        };
      }
      return {
        ...state,
        errors: {},
        ...action.result,
        counter: state.counter + 1,
      };
    case "clear_field_error": {
      if (!state.errors?.[action.fieldName]) {
        return state;
      }
      const { [action.fieldName]: _, ...rest } = state.errors;
      return {
        ...state,
        errors: rest,
      };
    }
    case "reset_form":
      return {
        ...initialState,
        counter: state.counter + 1,
      };
    default:
      return state;
  }
}, initialState);

const PendingContext = createContext(false);

export function InteractiveForm<ResultType, ErrorType extends string>({
  asChild,
  children,
  action,
  ...props
}: {
  asChild?: boolean;
  children: ReactNode;
  action: (
    formData: FormData,
  ) => Promise<InteractiveFormResult<ResultType, ErrorType>>;
} & Omit<ComponentProps<"form">, "action">) {
  return (
    <FormStateProvider>
      <InteractiveFormImpl action={action} {...props}>
        {children}
      </InteractiveFormImpl>
    </FormStateProvider>
  );
}

function InteractiveFormImpl({
  children,
  action,
  ...props
}: Omit<ComponentProps<"form">, "action"> & {
  action: (
    formData: FormData,
  ) => Promise<InteractiveFormResult<unknown, string>>;
}) {
  const [isPending, startTransition] = useTransition();
  const dispatch = useFormDispatch();
  const state = useFormState();

  if ("redirect" in state && typeof state.redirect === "string") {
    redirect(state.redirect);
  }

  if ("nextElement" in state && state.nextElement) {
    return state.nextElement;
  }
  return (
    <PendingContext.Provider value={isPending}>
      <form
        key={state.counter}
        {...props}
        onSubmit={async (e) => {
          e.preventDefault();

          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await action(formData);
            console.log("result", result);
            dispatch({ type: "set_form_result", result });
          });
          props.onSubmit?.(e);
        }}
        onReset={(e) => {
          dispatch({ type: "reset_form" });
          props.onReset?.(e);
        }}
        onChange={(e) => {
          if (e.target instanceof HTMLElement) {
            const fieldName = e.target.getAttribute("name");
            if (fieldName && state.errors?.[fieldName]) {
              dispatch({ type: "clear_field_error", fieldName });
            }
          }
        }}
      >
        {children}
      </form>
    </PendingContext.Provider>
  );
}

export function useFormResult<ResultType>() {
  const state = useFormState();
  return state.result as ResultType | undefined;
}

export function useFormPending() {
  return useContext(PendingContext);
}

export function PrintResult() {
  const result = useFormState();

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}

export function FormErrorMessage({
  children,
  match,
  name,
  ...props
}: ComponentProps<"span"> & { match?: string; name?: string }) {
  if (!name) {
    return <GlobalError {...props}>{children}</GlobalError>;
  }

  return (
    <FieldError {...props} name={name} match={match}>
      {children}
    </FieldError>
  );
}

function GlobalError({ children, ...props }: ComponentProps<"span">) {
  const state = useFormState();
  const errors = state.errors || {};

  if (Object.keys(errors).length > 0) {
    return (
      <span className="text-destructive text-sm" {...props}>
        {children}
      </span>
    );
  }

  return null;
}

function FieldError({
  children,
  name,
  match,
  ...props
}: ComponentProps<"span"> & { name: string; match?: string }) {
  const state = useFormState();
  const errors = state.errors || {};

  if (!errors[name]) {
    return null;
  }

  if (!match) {
    return (
      <span className="text-destructive text-sm" {...props}>
        {children}
      </span>
    );
  }

  if (errors[name].includes(match)) {
    return (
      <span className="text-destructive text-sm" {...props}>
        {children}
      </span>
    );
  }

  return null;
}

export function SubmitButton({
  children,
  asChild,
  ...buttonProps
}: Omit<ComponentProps<"button">, "type"> & {
  asChild?: boolean;
}) {
  const isPending = useFormPending();
  const props = {
    ...buttonProps,
    type: "submit",
    inert: isPending,
    className: cn({ "animate-pulse": isPending }, buttonProps.className),
  } as ComponentProps<"button">;

  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <button {...props}>{children}</button>;
}

export function SubmitMessage({ children }: ComponentProps<"span">) {
  const isPending = useFormPending();

  if (isPending) {
    return <Hidden>{children}</Hidden>;
  }

  return <Visible>{children}</Visible>;
}

export function LoadingMessage({ children }: ComponentProps<"span">) {
  const isPending = useFormPending();
  if (!isPending) {
    return <Hidden>{children}</Hidden>;
  }

  return <Visible>{children}</Visible>;
}
