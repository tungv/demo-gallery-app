"use client";

import { redirect } from "next/navigation";
import { createContext, useActionState, useContext } from "react";
import type { ComponentProps, ReactNode } from "react";

export interface InteractiveFormResult<ResultType, ErrorType extends string> {
  redirect?: string;
  errors?: ErrorType[];
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
  errors: [],
  result: NO_RESULT,
  counter: 0,
};

const errorsContext = createContext<string[]>([]);
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
  const [localState, formAction] = useActionState(
    async (state: LocalState<ResultType, ErrorType>, formData: FormData) => {
      const result = await action(formData);

      if (result.errors) {
        return {
          ...state,
          errors: result.errors,
        };
      }

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
    action: formAction,
  };

  return (
    <errorsContext.Provider value={localState.errors ?? []}>
      <resultContext.Provider value={localState.result ?? NO_RESULT}>
        <form key={localState.counter} {...formProps}>
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
  ...props
}: ComponentProps<"span"> & { match?: string }) {
  const errors = useContext(errorsContext);

  // if no match is provided, we will render the error message if there are any errors
  if (!match) {
    if (errors.length > 0) {
      return (
        <span className="text-destructive text-sm" {...props}>
          {children}
        </span>
      );
    }

    // otherwise, we will render an empty span
    return null;
  }

  if (!errors.includes(match)) {
    return null;
  }

  return (
    <span className="text-destructive text-sm" {...props}>
      {children}
    </span>
  );
}
