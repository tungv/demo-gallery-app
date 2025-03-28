"use client";

import { cn } from "@/lib/utils";
import * as FormPrimitive from "@radix-ui/react-form";
import type {
  FormFieldProps,
  FormLabelProps,
  FormProps,
  FormSubmitProps,
  FormMessageProps,
} from "@radix-ui/react-form";
import { Label } from "./label";

/**
 * Form's root component. Please check out the anatomy of a form below.
 *
 * @example
 * ```tsx
 * // simple form
 * <Form>
 *  <FormField name="field_name">
 *    <FormLabel>Label</FormLabel>
 *    <FormControl asChild>
 *      <Input />
 *    </FormControl>
 *    <FormMessage />
 *  </FormField>
 *  <FormSubmit>Submit</FormSubmit>
 * </Form>
 * ```
 */
export function Form({ className, children, ...props }: FormProps) {
  return (
    <FormPrimitive.Root
      {...props}
      className={cn(
        "grid grid-cols-1 gap-6 w-full max-w-md mx-auto",
        className,
      )}
    >
      {children}
    </FormPrimitive.Root>
  );
}

export function FormField({ className, children, ...props }: FormFieldProps) {
  return (
    <FormPrimitive.Field
      {...props}
      className={cn("grid grid-cols-subgrid gap-1.5", className)}
    >
      {children}
    </FormPrimitive.Field>
  );
}

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  return (
    <Label {...props} className={cn("font-medium", className)}>
      {children}
    </Label>
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: FormMessageProps) {
  return (
    <FormPrimitive.Message
      {...props}
      className={cn("text-sm font-medium text-destructive", className)}
    >
      {children}
    </FormPrimitive.Message>
  );
}

export function FormSubmit({ className, children, ...props }: FormSubmitProps) {
  return (
    <FormPrimitive.Submit
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
        "h-10 px-4 py-2",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[invalid]:bg-muted data-[invalid]:text-muted-foreground data-[invalid]:hover:bg-muted",
        className,
      )}
    >
      {children}
    </FormPrimitive.Submit>
  );
}

export const FormControl = FormPrimitive.Control;
