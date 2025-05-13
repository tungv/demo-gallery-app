"use client";

import { Slot } from "@radix-ui/react-slot";
import { useRouter } from "next/navigation";
import { createContext, Fragment, useContext, useTransition } from "react";
import type { ComponentProps, ReactNode } from "react";
import { createReducerContext } from "@/utils/reducer-context";
import { cn } from "@/lib/utils";
import { Hidden, Visible } from "../ui/reserve-layout";

interface TypedFormData<FieldNames extends string = string> extends FormData {
  get(name: FieldNames): string | null;
  getAll(name: FieldNames): string[];
  has(name: FieldNames): boolean;
  append(name: FieldNames, value: string | Blob, fileName?: string): void;
  set(name: FieldNames, value: string | Blob, fileName?: string): void;
  delete(name: FieldNames): void;
}

export interface InteractiveFormResult<FieldNames extends string = string> {
  redirect?: string;
  /*
    errors is a record of field names and their errors
    this is useful for displaying errors for specific fields
    and for clearing errors when the form is reset
  */
  errors?: {
    [fieldName in FieldNames]?: string[];
  };
  result?: unknown;
  nextElement?: ReactNode;
}

type LocalState<FieldNames extends string = string> = {
  errors?: Partial<Record<FieldNames, string[]>>;
  result?: unknown;
  nextElement?: ReactNode;
  counter: number;
  hasOuterBoundary: boolean;
  outerKey: number;
};

const NO_RESULT = Symbol("NO_RESULT");

const initialState: LocalState<string> = {
  errors: {},
  result: NO_RESULT,
  counter: 0,
  hasOuterBoundary: false,
  outerKey: 0,
};

type FormAction<FieldNames extends string = string> =
  | {
      type: "set_form_result";
      result: InteractiveFormResult<FieldNames>;
    }
  | { type: "clear_field_error"; fieldName: FieldNames }
  | { type: "reset_form" };

const [FormStateProvider, useFormState, useFormDispatch] = createReducerContext<
  FormAction<string>,
  LocalState<string>
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

        // reset outer when form result is successful
        outerKey: state.outerKey + 1,
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

type InteractiveFormProps<FieldNames extends string> = {
  asChild?: boolean;
  children: ReactNode;
  fields?: readonly FieldNames[];
  action: (
    formData: TypedFormData<FieldNames>,
  ) => Promise<InteractiveFormResult<FieldNames>>;
} & Omit<ComponentProps<"form">, "action">;

export function InteractiveForm<const FieldNames extends string>({
  asChild,
  children,
  action,
  fields: _fields, // We don't actually use this at runtime, just for type inference
  ...props
}: InteractiveFormProps<FieldNames>) {
  const context = useFormState();
  if (!context.hasOuterBoundary) {
    return (
      <FormStateProvider>
        <InteractiveFormImpl action={action} {...props}>
          {children}
        </InteractiveFormImpl>
      </FormStateProvider>
    );
  }
  return (
    <InteractiveFormImpl action={action} {...props}>
      {children}
    </InteractiveFormImpl>
  );
}

function InteractiveFormImpl<FieldNames extends string>({
  children,
  action,
  ...props
}: Omit<InteractiveFormProps<FieldNames>, "fields">) {
  const [isPending, startTransition] = useTransition();
  const dispatch = useFormDispatch();
  const state = useFormState();
  const router = useRouter();

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

          const formData = new FormData(
            e.currentTarget,
          ) as TypedFormData<FieldNames>;
          startTransition(async () => {
            const result = await action(formData);

            if ("redirect" in result && typeof result.redirect === "string") {
              router.push(result.redirect);
              return;
            }

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

export function useFormResult() {
  const state = useFormState();
  return state.result as unknown;
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

export function FormBoundary({ children }: { children: ReactNode }) {
  return (
    <FormStateProvider hasOuterBoundary>
      <FormBoundaryImpl>{children}</FormBoundaryImpl>
    </FormStateProvider>
  );
}

function FormBoundaryImpl({ children }: { children: ReactNode }) {
  const context = useFormState();
  const { outerKey } = context;

  return <Fragment key={outerKey}>{children}</Fragment>;
}
