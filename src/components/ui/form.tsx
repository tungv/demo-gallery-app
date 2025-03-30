"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import { createContext, useContext, useEffect, useId, useRef } from "react";
import type { ComponentProps, Dispatch, RefObject } from "react";

interface FormContext {
  formRef: RefObject<HTMLFormElement | null> | null;
  fields: Record<string, Partial<ValidityState>>;
}

const defaultContext: FormContext = {
  formRef: null,
  fields: {},
};

type FormContextAction =
  | {
      type: "set_field_validity";
      fieldName: string;
      validity: Partial<ValidityState>;
    }
  | { type: "reset_field_validity"; fieldName: string }
  | { type: "reset_all_validity" };

function validityStateToPlainObject(validity: Partial<ValidityState>) {
  const props = [
    "valid",
    "valueMissing",
    "typeMismatch",
    "patternMismatch",
    "tooLong",
    "tooShort",
    "rangeOverflow",
    "rangeUnderflow",
    "stepMismatch",
    "customError",
  ];

  const obj: Partial<Record<keyof ValidityState, boolean>> = {};

  for (const prop of props) {
    if (validity[prop as keyof ValidityState] === true) {
      obj[prop as keyof ValidityState] = true;
    }
  }

  return obj;
}

const [FormContextProvider, useFormContext, useFormDispatch] =
  createReducerContext(
    (state: FormContext, action: FormContextAction): FormContext => {
      switch (action.type) {
        case "set_field_validity":
          return {
            ...state,
            fields: {
              ...state.fields,
              [action.fieldName]: validityStateToPlainObject(action.validity),
            },
          };
        case "reset_field_validity": {
          const { [action.fieldName]: _, ...remainingFields } = state.fields;
          return {
            ...state,
            fields: remainingFields,
          };
        }
        case "reset_all_validity":
          return {
            ...state,
            fields: {},
          };
        default:
          return state;
      }
    },
    defaultContext,
  );

function useFormFieldValidationState(fieldName: string) {
  const context = useFormContext();

  return context.fields[fieldName] || { valid: true };
}

function useResetForm() {
  const dispatch = useFormDispatch();

  return () => {
    dispatch({
      type: "reset_all_validity",
    });
  };
}

function useUpdateValidity(fieldName: string) {
  const dispatch = useFormDispatch();

  return (validity: Partial<ValidityState>) => {
    dispatch({ type: "set_field_validity", fieldName, validity });
  };
}

function useResetValidity(fieldName: string) {
  const dispatch = useFormDispatch();

  return () => {
    dispatch({ type: "reset_field_validity", fieldName });
  };
}

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
  const resetForm = useResetForm();

  const formProps: ComponentProps<"form"> = {
    ...props,
    ref: formRef,
    className: cn("grid grid-cols-1 gap-4 p-4 max-w-md w-full", className),
    onReset: (event) => {
      console.log("onReset");
      // Reset all form validity states
      resetForm();
    },
  };

  const inner = asChild ? (
    <CustomFormImpl {...formProps}>{children}</CustomFormImpl>
  ) : (
    <FormImpl {...formProps}>{children}</FormImpl>
  );

  return <FormContextProvider formRef={formRef}>{inner}</FormContextProvider>;
}

function CustomFormImpl({ children, ...props }: ComponentProps<"form">) {
  const resetForm = useResetForm();

  return (
    <Slot {...props} onReset={resetForm}>
      {children}
    </Slot>
  );
}

function FormImpl({ children, ...props }: ComponentProps<"form">) {
  const resetForm = useResetForm();

  return (
    <form {...props} onReset={resetForm}>
      {children}
    </form>
  );
}

interface FormFieldContext {
  name: string;
  id: string;
  validityState: Partial<ValidityState>;
  messageIds: string[];
}

type FormFieldAction =
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
  const updateValidity = useUpdateValidity(context.name);
  const resetValidity = useResetValidity(context.name);

  // learned from radix react form control, we bind the actual input.onchange instead of react onChange (which is actually oninput)
  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    function onChange(event: Event) {
      const input = event.target as HTMLInputElement;
      console.log("input.onchange");
      updateValidity(input.validity);
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
      const input = event.target as HTMLInputElement;
      console.log("input.oninvalid");
      updateValidity(input.validity);
    },

    onChange(event) {
      // reset validity state
      console.log("input.oninput");
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
  const validityState = useFormFieldValidationState(context.name);
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
