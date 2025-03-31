"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import { useEffect, useId, useRef } from "react";
import type { ComponentProps } from "react";

interface FormContext {
  fields: Record<
    string,
    { validity: Partial<ValidityState>; userInteracted: boolean }
  >;
  isPristine: boolean;
}

const defaultContext: FormContext = {
  fields: {},
  isPristine: true,
};

type FormContextAction =
  | {
      type: "set_field_validity";
      fieldName: string;
      validity: Partial<ValidityState>;
    }
  | { type: "reset_field_validity"; fieldName: string }
  | { type: "reset_all_validity" }
  | { type: "set_dirty" }
  | { type: "set_pristine" }
  | { type: "set_all_fields_interacted" };

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

  const obj = {} as Partial<Record<keyof ValidityState, boolean>>;

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
              [action.fieldName]: {
                validity: validityStateToPlainObject(action.validity),
                userInteracted: true,
              },
            },
          };
        case "reset_field_validity": {
          const { [action.fieldName]: _, ...remainingFields } = state.fields;
          return {
            ...state,
            fields: {
              ...remainingFields,
              [action.fieldName]: {
                validity: { valid: true },
                userInteracted: false,
              },
            },
          };
        }
        case "reset_all_validity":
          return {
            ...state,
            fields: {},
            isPristine: true,
          };
        case "set_dirty":
          return {
            ...state,
            isPristine: false,
          };
        case "set_pristine":
          return {
            ...state,
            isPristine: true,
          };
        case "set_all_fields_interacted": {
          const updatedFields = { ...state.fields };

          // Set all fields as interacted
          for (const fieldName of Object.keys(updatedFields)) {
            updatedFields[fieldName] = {
              ...updatedFields[fieldName],
              userInteracted: true,
            };
          }

          return {
            ...state,
            fields: updatedFields,
          };
        }
        default:
          return state;
      }
    },
    defaultContext,
  );

function useFormFieldValidationState(fieldName: string) {
  const context = useFormContext();
  const field = context.fields[fieldName];

  return field?.validity || { valid: true };
}

function useFormFieldInteracted(fieldName: string) {
  const context = useFormContext();
  const field = context.fields[fieldName];

  return field?.userInteracted || false;
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
    dispatch({
      type: "set_field_validity",
      fieldName,
      validity,
    });
  };
}

function useResetValidity(fieldName: string) {
  const dispatch = useFormDispatch();

  return () => {
    dispatch({ type: "reset_field_validity", fieldName });
  };
}

function useSetFormDirty() {
  const dispatch = useFormDispatch();

  return () => {
    dispatch({
      type: "set_dirty",
    });
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
 *    <InputControl asChild>
 *      <Input />
 *    </InputControl>
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

// Add interface for custom data attributes
interface FormDataAttributes {
  "data-pristine"?: "";
  "data-dirty"?: "";
  "data-valid"?: "";
  "data-invalid"?: "";
  "data-user-valid"?: "";
  "data-user-invalid"?: "";
}

function useFormAttributes() {
  const formContext = useFormContext();

  // Check if form fields are valid
  const isInvalid = Object.values(formContext.fields).some(
    (field) => field.validity.valid !== true,
  );

  // Check if any field has been interacted with
  const hasUserInteractedWithAnyField = Object.values(formContext.fields).some(
    (field) => field.userInteracted,
  );

  console.log({ fields: Object.values(formContext.fields) });

  // Create data attributes that will only be added when true
  const dataAttributes: Partial<FormDataAttributes> = {};
  const ariaAttributes: Record<string, boolean | string | undefined> = {};

  if (formContext.isPristine) {
    dataAttributes["data-pristine"] = "";
  } else {
    dataAttributes["data-dirty"] = "";
  }

  if (isInvalid) {
    dataAttributes["data-invalid"] = "";
    ariaAttributes["aria-invalid"] = "";
  } else {
    dataAttributes["data-valid"] = "";
  }

  // Add user interaction based validation states for the entire form
  if (hasUserInteractedWithAnyField) {
    if (isInvalid) {
      dataAttributes["data-user-invalid"] = "";
    } else {
      dataAttributes["data-user-valid"] = "";
    }
  }

  return { dataAttributes, ariaAttributes };
}

export function Form({ children, className, asChild, ...props }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const resetForm = useResetForm();
  const dispatch = useFormDispatch();

  // Use proper type casting for the form props
  const formProps: ComponentProps<"form"> = {
    ...props,
    ref: formRef,
    className: cn("grid grid-cols-1 gap-4 p-4 max-w-md w-full", className),
    onReset: (event) => {
      console.log("onReset");
      // Reset all form validity states
      resetForm();
    },
    onChange: (event) => {
      // Mark form as dirty on any change
      dispatch({ type: "set_dirty" });
      if (props.onChange) {
        props.onChange(event);
      }
    },
    onSubmit: (event) => {
      // Mark all fields as interacted when form is submitted
      dispatch({ type: "set_all_fields_interacted" });

      // Call the original onSubmit if provided
      if (props.onSubmit) {
        props.onSubmit(event);
      }
    },
  };

  const inner = asChild ? (
    <CustomFormImpl {...formProps}>{children}</CustomFormImpl>
  ) : (
    <FormImpl {...formProps}>{children}</FormImpl>
  );

  return <FormContextProvider>{inner}</FormContextProvider>;
}

function CustomFormImpl({ children, ...props }: ComponentProps<"form">) {
  const resetForm = useResetForm();
  const { dataAttributes, ariaAttributes } = useFormAttributes();

  return (
    <Slot
      {...props}
      {...dataAttributes}
      {...ariaAttributes}
      onReset={resetForm}
    >
      {children}
    </Slot>
  );
}

function FormImpl({ children, ...props }: ComponentProps<"form">) {
  const resetForm = useResetForm();
  const { dataAttributes, ariaAttributes } = useFormAttributes();

  return (
    <form
      {...props}
      {...dataAttributes}
      {...ariaAttributes}
      onReset={resetForm}
    >
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
  "data-user-invalid"?: boolean;
  "data-user-valid"?: boolean;
}

export function InputControl({
  children,
  asChild,
  ...props
}: FormControlProps) {
  const fieldContext = useFormFieldState();
  const formContext = useFormContext();
  const updateValidity = useUpdateValidity(fieldContext.name);
  const resetValidity = useResetValidity(fieldContext.name);

  const controlId = `control-${fieldContext.id}`;
  const field = formContext.fields[fieldContext.name] || {
    validity: { valid: true },
    userInteracted: false,
  };
  const isValid = field.validity.valid !== false;
  const hasUserInteracted = field.userInteracted;

  // Create data attributes that will only be added when they're true
  const dataAttributes: Partial<FormControlDataAttributes> = {};
  const ariaAttributes: Record<string, boolean | string | undefined> = {};

  if (isValid) {
    dataAttributes["data-valid"] = true;
  } else {
    dataAttributes["data-invalid"] = true;
    ariaAttributes["aria-invalid"] = true;
  }

  // Add user interaction based validation states
  if (hasUserInteracted) {
    if (isValid) {
      dataAttributes["data-user-valid"] = true;
    } else {
      dataAttributes["data-user-invalid"] = true;
    }
  }

  // Only add aria-describedby if there are actual message IDs
  if (fieldContext.messageIds.length > 0) {
    ariaAttributes["aria-describedby"] = fieldContext.messageIds.join(" ");
  }

  // Only add aria attributes if they're true
  if (props.required) {
    ariaAttributes["aria-required"] = true;
  }

  if (props.disabled) {
    ariaAttributes["aria-busy"] = true;
  }

  if (props.readOnly) {
    ariaAttributes["aria-readonly"] = true;
  }

  const inputProps: ComponentProps<"input"> & FormControlDataAttributes = {
    ...props,
    id: controlId,
    name: fieldContext.name,
    title: "",
    ...dataAttributes,
    ...ariaAttributes,
    onInvalid(event) {
      // this is triggered when the form is submitted and the input is invalid

      // prevent the default browser validation message from showing
      event.preventDefault();

      // update state
      const input = event.target as HTMLInputElement;
      updateValidity(input.validity);
    },
    onChange() {
      // reset validity state
      // we don't want to the validation message to show up when the user is typing
      resetValidity();
    },
    onBlur(event) {
      // after the user has interacted with the input, we update the validity state to show validation errors (if any)
      const input = event.target as HTMLInputElement;
      updateValidity(input.validity);
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
