"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import { createContext, useContext, useEffect, useId, useRef } from "react";
import type { ComponentProps, RefObject } from "react";

interface FormContext {
  formRef: RefObject<HTMLFormElement | null> | null;
}

const defaultContext: FormContext = {
  formRef: null,
};

type FormContextAction = {};

const [FormContextProvider, useFormContext] = createReducerContext(
  (state: FormContext, action: FormContextAction): FormContext => {
    return state;
  },
  defaultContext,
);

/**
 * Form
 *
 * Anatomy:
 *
 * ```tsx
 * <Form>
 *  <FormField name="field_name">
 *    <FormLabel />
 *    <FormControl>
 *      <Input />
 *    </FormControl>
 *    <FormMessage />
 *  </FormField>
 *  <FormSubmit />
 * </Form>
 * ```
 *
 *
 */

interface FormProps extends ComponentProps<"form"> {
  asChild?: boolean;
}

export function Form({ children, className, asChild, ...props }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const formProps: ComponentProps<"form"> = {
    ...props,
    ref: formRef,
    className: cn("grid grid-cols-1 gap-4 p-4 max-w-md w-full", className),
  };

  const inner = asChild ? (
    <Slot {...formProps}>{children}</Slot>
  ) : (
    <form {...formProps}>{children}</form>
  );

  return <FormContextProvider formRef={formRef}>{inner}</FormContextProvider>;
}

interface FormFieldContext {
  name: string;
  id: string;
  validityState: Partial<ValidityState>;
  messageIds: string[];
}

type FormFieldAction =
  | {
      type: "change_validity";
      payload: Partial<ValidityState>;
    }
  | {
      type: "reset_validity";
    }
  | {
      type: "add_message";
      payload: string;
    }
  | {
      type: "remove_message";
      payload: string;
    };

const defaultFormFieldContext: FormFieldContext = {
  name: "",
  id: "",
  validityState: { valid: true },
  messageIds: [],
};

const [FormFieldProvider, useFormFieldState, useFormFieldDispatch] =
  createReducerContext(
    (state: FormFieldContext, action: FormFieldAction): FormFieldContext => {
      if (action.type === "change_validity") {
        return {
          ...state,
          validityState: action.payload,
        };
      }

      if (action.type === "reset_validity") {
        return {
          ...state,
          validityState: { valid: true },
        };
      }

      if (action.type === "add_message") {
        return {
          ...state,
          messageIds: [...state.messageIds, action.payload],
        };
      }

      if (action.type === "remove_message") {
        return {
          ...state,
          messageIds: state.messageIds.filter((id) => id !== action.payload),
        };
      }

      return state;
    },
    defaultFormFieldContext,
  );

function useUpdateValidity() {
  const context = useFormFieldState();

  if (!context) {
    throw new Error("useUpdateValidity must be used within a FormField");
  }

  const dispatch = useFormFieldDispatch();

  return (input: HTMLInputElement) => {
    dispatch({
      type: "change_validity",
      payload: input.validity,
    });
  };
}

function useResetValidity() {
  const context = useFormFieldState();

  if (!context) {
    throw new Error("useResetValidity must be used within a FormField");
  }

  const dispatch = useFormFieldDispatch();

  return () => {
    dispatch({ type: "reset_validity" });
  };
}

interface FormFieldProps extends ComponentProps<"div"> {
  name: string;
}

export function FormField({ name, children, ...props }: FormFieldProps) {
  const id = useId();

  return (
    <FormFieldProvider name={name} id={id}>
      <FormFieldImpl {...props}>{children}</FormFieldImpl>
    </FormFieldProvider>
  );
}

function FormFieldImpl({ children, ...props }: ComponentProps<"div">) {
  const formContext = useFormContext();
  const resetValidity = useResetValidity();

  if (!formContext) {
    throw new Error("FormField must be used within a Form");
  }

  // biome-ignore lint/style/noNonNullAssertion: form ref must be present, formRef.current may be null however
  const formRef = formContext.formRef!;

  // add reset listener to form
  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    function handleReset() {
      resetValidity();
    }

    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [formRef, resetValidity]);

  return <div {...props}>{children}</div>;
}

interface FormLabelProps extends ComponentProps<"label"> {}

export function FormLabel({ children, className, ...props }: FormLabelProps) {
  const context = useFormFieldState();

  if (!context) {
    throw new Error("FormLabel must be used within a FormField");
  }

  const controlId = `control-${context.id}`;

  return (
    <label
      {...props}
      htmlFor={controlId}
      className={cn("text-sm font-bold tracking-tight", className)}
    >
      {children}
    </label>
  );
}

interface FormControlProps extends ComponentProps<"input"> {
  asChild?: boolean;
}

interface FormControlDataAttributes {
  "data-invalid"?: boolean;
  "data-valid"?: boolean;
}

export function InputControl({
  children,
  asChild,
  ...props
}: FormControlProps) {
  const context = useFormFieldState();
  const inputRef = useRef<HTMLInputElement>(null);
  const updateValidity = useUpdateValidity();
  const resetValidity = useResetValidity();

  // learned from radix react form control, we bind the actual input.onchange instead of react onChange (which is actually oninput)
  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    function onChange(event: Event) {
      updateValidity(event.target as HTMLInputElement);
    }

    input.addEventListener("change", onChange);

    return () => {
      input.removeEventListener("change", onChange);
    };
  }, [updateValidity]);

  if (!context) {
    throw new Error("FormControl must be used within a FormField");
  }

  const controlId = `control-${context.id}`;

  const inputProps: ComponentProps<"input"> & FormControlDataAttributes = {
    ...props,
    id: controlId,
    name: context.name,
    ref: inputRef,

    title: "",

    "aria-describedby": context.messageIds.join(" "),
    "aria-invalid": !context.validityState.valid,
    "aria-required": props.required,
    "aria-busy": props.disabled,
    "aria-readonly": props.readOnly,

    // data attributes
    "data-invalid": !context.validityState.valid,
    "data-valid": context.validityState.valid,

    onInvalid(event) {
      event.preventDefault();
      updateValidity(event.target as HTMLInputElement);
    },

    onChange(event) {
      // reset validity state
      resetValidity();
    },
  };

  if (asChild) {
    return <Slot {...inputProps}>{children}</Slot>;
  }

  return <input {...inputProps} />;
}

interface FormMessageProps extends ComponentProps<"span"> {
  match: keyof ValidityState;
}

export function FormMessage({
  children,
  match,
  className,
  ...props
}: FormMessageProps) {
  const isInvalid = match !== "valid";
  const context = useFormFieldState();
  const validityState = context.validityState;
  const hidden = !validityState[match];

  const id = useId();

  // if this component is present, add the message id to the context
  const dispatch = useFormFieldDispatch();

  useEffect(() => {
    if (hidden) {
      return;
    }
    dispatch({
      type: "add_message",
      payload: id,
    });

    return () => {
      dispatch({
        type: "remove_message",
        payload: id,
      });
    };
  }, [dispatch, id, hidden]);

  if (hidden) {
    return null;
  }

  return (
    <span
      {...props}
      aria-live="polite"
      aria-atomic="true"
      id={id}
      className={cn(
        "text-sm",
        {
          "text-destructive": isInvalid,
          "text-primary/80": !isInvalid,
        },
        className,
      )}
    >
      {children}
    </span>
  );
}

interface FormSubmitProps extends Omit<ComponentProps<"button">, "type"> {
  asChild?: boolean;
}

export function FormSubmit({ children, asChild, ...props }: FormSubmitProps) {
  const buttonProps = {
    ...props,
    type: "submit" as const,
  };

  if (asChild) {
    return <Slot {...buttonProps}>{children}</Slot>;
  }

  return <button {...buttonProps}>{children}</button>;
}
