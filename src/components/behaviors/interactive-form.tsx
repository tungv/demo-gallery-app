"use client";

import { Slot } from "@radix-ui/react-slot";
import { useRouter } from "next/navigation";
import {
  createContext,
  Fragment,
  useContext,
  useRef,
  useTransition,
  useLayoutEffect,
} from "react";
import type { ComponentProps, ReactNode } from "react";
import { createReducerContext } from "@/utils/reducer-context";
import { cn } from "@/lib/utils";
import { Hidden, Visible } from "../ui/reserve-layout";
import { composeRefs } from "@/utils/compose-refs";

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
  refresh?: boolean;
  /*
    errors is a record of field names and their errors
    this is useful for displaying errors for specific fields
    and for clearing errors when the form is reset
  */
  errors?: {
    [fieldName in FieldNames | "$"]?: string[];
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
  formRef?: React.RefObject<HTMLFormElement | null>;
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
};

const NO_RESULT = Symbol("NO_RESULT");

const initialState: LocalState<string> = {
  errors: {},
  result: NO_RESULT,
  counter: 0,
  hasOuterBoundary: false,
  outerKey: 0,
  formRef: undefined,
  restoreFocusRef: undefined,
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
        // keep counter and outerKey unchanged so DOM nodes persist
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
        // Preserve persistent values
        counter: state.counter + 1,
        hasOuterBoundary: state.hasOuterBoundary,
        outerKey: state.outerKey,
        formRef: state.formRef,
        restoreFocusRef: state.restoreFocusRef,
      };
    default:
      return state;
  }
}, initialState);

const PendingContext = createContext(false);

type InteractiveAction<FieldNames extends string> = (
  formData: TypedFormData<FieldNames>,
) => Promise<InteractiveFormResult<FieldNames>>;

type InteractiveFormProps<FieldNames extends string> = {
  asChild?: boolean;
  children: ReactNode;
  fields?: readonly FieldNames[];
  action?: InteractiveAction<FieldNames>;
} & Omit<ComponentProps<"form">, "action">;

export function InteractiveForm<const FieldNames extends string>({
  asChild,
  children,
  action,
  fields: _fields, // We don't actually use this at runtime, just for type inference
  ...props
}: InteractiveFormProps<FieldNames>) {
  const context = useFormState();

  const tempRef = useRef<HTMLFormElement>(null);
  const tempRestoreFocusRef = useRef<HTMLElement>(null);

  if (!context.hasOuterBoundary) {
    return (
      <FormStateProvider
        formRef={tempRef}
        restoreFocusRef={tempRestoreFocusRef}
      >
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
  ref,
  ...props
}: Omit<InteractiveFormProps<FieldNames>, "fields">) {
  const [isPending, startTransition] = useTransition();
  const dispatch = useFormDispatch();
  const state = useFormState();
  const router = useRouter();
  const formRef = state.formRef;
  const finalRef = composeRefs(formRef, ref);
  const restoreFocusRef = state.restoreFocusRef;

  useLayoutEffect(() => {
    if (!isPending && restoreFocusRef?.current) {
      console.log("restoring focus to", restoreFocusRef.current);
      restoreFocusRef.current.focus?.();
    }
  }, [isPending, restoreFocusRef]);

  if ("nextElement" in state && state.nextElement) {
    return state.nextElement;
  }

  return (
    <PendingContext.Provider value={isPending}>
      <form
        {...props}
        inert={isPending}
        ref={finalRef}
        key={state.counter}
        onSubmit={async (e) => {
          e.preventDefault();

          if (action) {
            const form = e.currentTarget;
            const activeEl = document.activeElement as HTMLElement | null;

            const formData = new FormData(form) as TypedFormData<FieldNames>;
            startTransition(async () => {
              const result = await action(formData);

              if ("redirect" in result && typeof result.redirect === "string") {
                router.push(result.redirect);
                return;
              }

              if ("refresh" in result && result.refresh === true) {
                router.refresh();
              }

              console.log("activeEl", activeEl);

              // Schedule state update (and focus restore) as a separate, low-urgency transition.
              startTransition(() => {
                dispatch({ type: "set_form_result", result });

                if (restoreFocusRef) {
                  if (activeEl?.isConnected) {
                    restoreFocusRef.current = activeEl;
                  } else {
                    restoreFocusRef.current = null;
                  }
                }
              });
            });
          }
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
    className: cn(
      { "motion-safe:animate-pulse reduced-motion:opacity-50": isPending },
      buttonProps.className,
    ),
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
  // create formRef but don't mount it
  const formRef = useRef<HTMLFormElement>(null);
  const restoreFocusRef = useRef<HTMLElement>(null);
  return (
    <FormStateProvider
      hasOuterBoundary
      formRef={formRef}
      restoreFocusRef={restoreFocusRef}
    >
      <FormBoundaryImpl>{children}</FormBoundaryImpl>
    </FormStateProvider>
  );
}

function FormBoundaryImpl({ children }: { children: ReactNode }) {
  const context = useFormState();
  const { outerKey } = context;

  return <Fragment key={outerKey}>{children}</Fragment>;
}

export function ActionButton<FieldNames extends string = string>({
  children,
  formAction,
  asChild,
  ...btnProps
}: Omit<ComponentProps<"button">, "type" | "formAction"> & {
  formAction: InteractiveAction<FieldNames>;
  asChild?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dispatch = useFormDispatch();
  const formRef = useFormState().formRef;
  const { restoreFocusRef } = useFormState();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const form = formRef?.current;
    if (!form) {
      return;
    }

    const activeEl = (document.activeElement as HTMLElement) || e.currentTarget;

    const formData = new FormData(form) as TypedFormData<FieldNames>;
    startTransition(async () => {
      const result = await formAction(formData);

      if ("redirect" in result && typeof result.redirect === "string") {
        router.push(result.redirect);
        return;
      }

      if ("refresh" in result && result.refresh === true) {
        router.refresh();
      }

      // Reset values but keep DOM nodes intact
      form.reset();

      // Dispatch result and restore focus in a new transition for smoother UI.
      startTransition(() => {
        dispatch({ type: "set_form_result", result });

        if (restoreFocusRef) {
          if (activeEl?.isConnected) {
            restoreFocusRef.current = activeEl;
          } else {
            restoreFocusRef.current = null;
          }
        }
      });
    });
  }

  const props = {
    ...btnProps,
    type: "button",
    onClick: handleClick,
    inert: isPending,
    className: cn(
      { "motion-safe:animate-pulse reduced-motion:opacity-50": isPending },
      btnProps.className,
    ),
  } as ComponentProps<"button">;

  if (asChild) {
    return (
      <PendingContext.Provider value={isPending}>
        <Slot {...props}>{children}</Slot>
      </PendingContext.Provider>
    );
  }

  return (
    <PendingContext.Provider value={isPending}>
      <button {...props}>{children}</button>
    </PendingContext.Provider>
  );
}

export function Success({ children }: ComponentProps<"span">) {
  const result = useFormResult();

  if (result === NO_RESULT) {
    return null;
  }
  return children;
}
