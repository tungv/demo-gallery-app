"use client";

import { redirect } from "next/navigation";
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useState,
} from "react";
import type { ComponentProps, ReactNode } from "react";

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

type LocalState<ResultType, ErrorType extends string> = InteractiveFormResult<
  ResultType,
  ErrorType
> & { counter: number };

const NO_RESULT = Symbol("NO_RESULT");

// biome-ignore lint/suspicious/noExplicitAny: we don't care about the types here
const initialState: LocalState<any, any> = {
  errors: {},
  result: NO_RESULT,
  counter: 0,
};

const errorsContext = createContext<Record<string, string[]>>({});
const resultContext = createContext<unknown>(NO_RESULT);

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
  // Add local state for field errors that we can update immediately
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [localState, formAction] = useActionState(
    async (state: LocalState<ResultType, ErrorType>, formData: FormData) => {
      const result = await action(formData);

      if (result.errors) {
        // Update our local field errors when we get server errors
        setFieldErrors(result.errors);
        return {
          ...state,
          errors: result.errors,
        };
      }

      // Clear field errors on successful submission
      setFieldErrors({});
      return {
        ...state,
        ...result,
        counter: state.counter + 1,
      };
    },
    initialState,
  );

  if ("redirect" in localState && typeof localState.redirect === "string") {
    redirect(localState.redirect);
  }

  // if the nextElement exists, render it
  if ("nextElement" in localState && localState.nextElement) {
    return localState.nextElement;
  }

  const formProps = {
    ...props,
  };

  return (
    <errorsContext.Provider value={fieldErrors}>
      <resultContext.Provider value={localState.result ?? NO_RESULT}>
        <form
          key={localState.counter}
          {...formProps}
          onSubmit={(e) => {
            e.preventDefault();

            props.onSubmit?.(e);
            const formData = new FormData(e.currentTarget);
            startTransition(() => {
              formAction(formData);
            });
          }}
          onReset={(e) => {
            // Clear all field errors on reset
            setFieldErrors({});
            props.onReset?.(e);
          }}
          onChange={(e) => {
            if (e.target instanceof HTMLElement) {
              const fieldName = e.target.getAttribute("name");
              if (fieldName && fieldErrors[fieldName]) {
                // Clear error for the changed field by creating a new error state object
                setFieldErrors((current) => {
                  const { [fieldName]: _, ...rest } = current;
                  return rest;
                });
              }
            }
          }}
        >
          {children}
        </form>
      </resultContext.Provider>
    </errorsContext.Provider>
  );
}

export function useFormResult<ResultType>() {
  const result = useContext(resultContext) as ResultType | undefined;

  if (!result) {
    throw new Error("useFormResult must be used within a FormResultProvider");
  }

  return result;
}

export function PrintResult() {
  const result = useFormResult();

  if (result === NO_RESULT) {
    return <pre>no result</pre>;
  }

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
  const errors = useContext(errorsContext);

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
  const errors = useContext(errorsContext);

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
