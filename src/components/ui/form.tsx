"use client";

import { cn } from "@/lib/utils";
import * as FormPrimitive from "@radix-ui/react-form";
import type {
  FormFieldProps,
  FormLabelProps,
  FormProps,
} from "@radix-ui/react-form";

/**
 * Form's root component. Please check out the anatomy of a form below.
 *
 * @example
 * ```tsx
 * // simple form
 * <Form>
 *  <FormField name="field_name">
 *    <FormLabel>
 *    <FormControl asChild>
 *      <Input />
 *    </FormControl>
 *    <FormMessage />
 *  </FormField>
 * </Form>
 * ```
 */
export function Form({ className, children, ...props }: FormProps) {
  return (
    <FormPrimitive.Root
      {...props}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      {children}
    </FormPrimitive.Root>
  );
}

export function FormField({ className, children, ...props }: FormFieldProps) {
  return (
    <FormPrimitive.Field {...props} className={cn(className)}>
      {children}
    </FormPrimitive.Field>
  );
}

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  return (
    <FormPrimitive.Label {...props} className={cn(className)}>
      {children}
    </FormPrimitive.Label>
  );
}
