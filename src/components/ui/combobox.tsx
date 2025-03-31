"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { createContext, useCallback, useContext } from "react";
import { Slot } from "@radix-ui/react-slot";

interface ComboboxState {
  selected: string[];
  open: boolean;
  multiple: boolean;
}

type ComboboxAction =
  | { type: "select"; value: string }
  | { type: "deselect"; value: string }
  | { type: "set_open"; open: boolean };

const defaultComboboxState: ComboboxState = {
  selected: [],
  open: false,
  multiple: false,
};

const [ComboboxProvider, useComboboxState, useComboboxDispatch] =
  createReducerContext(
    (state: ComboboxState, action: ComboboxAction): ComboboxState => {
      switch (action.type) {
        case "select":
          if (state.multiple) {
            return {
              ...state,
              selected: [...state.selected, action.value],
            };
          }
          return {
            ...state,
            selected: [action.value],
            open: false,
          };
        case "deselect":
          return {
            ...state,
            selected: state.selected.filter((item) => item !== action.value),
          };
        case "set_open":
          return {
            ...state,
            open: action.open,
          };

        default:
          return state;
      }
    },
    defaultComboboxState,
  );

interface ComboboxProps {
  name?: string;
  multiple?: boolean;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
  children: React.ReactNode;
}

function toArray(value: string | string[] | undefined) {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function Combobox({
  name,
  multiple,
  value,
  onValueChange,
  defaultValue,
  children,
}: ComboboxProps) {
  // cannot accept both value and defaultValue
  if (value !== undefined && defaultValue !== undefined) {
    throw new Error("Cannot accept both value and defaultValue");
  }

  const selected = value
    ? toArray(value)
    : defaultValue
      ? toArray(defaultValue)
      : [];

  const middleware = useCallback(
    (
      dispatch: ReturnType<typeof useComboboxDispatch>,
      getNextState: (action: ComboboxAction) => ComboboxState,
    ) =>
      (action: ComboboxAction) => {
        if (
          typeof onValueChange === "function" &&
          (action.type === "select" || action.type === "deselect")
        ) {
          const state = getNextState(action);
          onValueChange(state.selected);
        }
        dispatch(action);
      },
    [onValueChange],
  );

  return (
    <ComboboxProvider
      selected={selected}
      multiple={multiple ?? false}
      middleware={middleware}
    >
      <ComboboxImpl name={name} onValueChange={onValueChange}>
        {children}
      </ComboboxImpl>
    </ComboboxProvider>
  );
}

function ComboboxImpl({
  name,
  onValueChange,
  children,
}: {
  name?: string;
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
}) {
  const dispatch = useComboboxDispatch();
  const state = useComboboxState();

  // if name is provided, we need to create a set of hidden inputs to store the values
  const inputs = name ? (
    <>
      {state.selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </>
  ) : null;

  return (
    <Popover
      open={state.open}
      onOpenChange={(open) => dispatch({ type: "set_open", open })}
    >
      {children}
      {inputs}
    </Popover>
  );
}

function ComboboxTrigger({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverTrigger> & {
  asChild?: boolean;
}) {
  return (
    <PopoverTrigger
      asChild={asChild}
      className={cn("flex w-full justify-between", className)}
      {...props}
    >
      {children}
    </PopoverTrigger>
  );
}

function ComboboxContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverContent>) {
  return (
    <PopoverContent className="w-[200px] p-0" {...props}>
      <Command className={cn("max-h-[300px] overflow-y-auto p-1", className)}>
        {children}
      </Command>
    </PopoverContent>
  );
}

function ComboboxInput({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandInput>) {
  return (
    <div className="flex items-center border-b px-3">
      <CommandInput
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function ComboboxOptions({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandList>) {
  return (
    <CommandList
      className={cn("max-h-[300px] overflow-y-auto p-1", className)}
      {...props}
    >
      {children}
    </CommandList>
  );
}

const comboboxOptionValueContext = createContext<string | undefined>(undefined);

function ComboboxOption({
  className,
  children,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandItem> & {
  value: string;
}) {
  const state = useComboboxState();
  const dispatch = useComboboxDispatch();
  const selected = state.selected.includes(value);

  return (
    <CommandItem
      className={cn(
        "flex flex-row justify-between gap-2",
        {
          "bg-accent text-accent-foreground": selected,
        },
        className,
      )}
      value={value}
      onSelect={(currentValue) => {
        if (selected) {
          dispatch({ type: "deselect", value: currentValue });
        } else {
          dispatch({ type: "select", value: currentValue });
        }
      }}
      {...props}
    >
      <comboboxOptionValueContext.Provider value={value}>
        {children}
      </comboboxOptionValueContext.Provider>
    </CommandItem>
  );
}

function ComboboxIndicator({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  const state = useComboboxState();
  const value = useContext(comboboxOptionValueContext);

  if (value === undefined) {
    return null;
  }

  const selected = state.selected.includes(value);

  return (
    <Slot
      className={cn({
        "opacity-100": selected,
        "opacity-0": !selected,
      })}
      aria-hidden={!selected}
      {...props}
    >
      {children}
    </Slot>
  );
}

function ComboboxEmpty({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandEmpty>) {
  return (
    <CommandEmpty
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    >
      {children}
    </CommandEmpty>
  );
}

export function ComboboxValues({
  placeholder,
  locale,
}: {
  placeholder: string;
  locale?: string;
}) {
  const state = useComboboxState();
  if (state.selected.length === 0) {
    return placeholder;
  }

  const listFormat = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  });

  const parts = listFormat.formatToParts(state.selected);

  return (
    <span className="truncate">
      {parts.map((part, index) => {
        if (part.type === "element") {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: just a span without state
            <span className="font-semibold" key={index}>
              {part.value}
            </span>
          );
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: just a span without state
          <span className="text-muted-foreground" key={index}>
            {part.value}
          </span>
        );
      })}
    </span>
  );
}

export function useSelectedValues() {
  const state = useComboboxState();
  return state.selected;
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  ComboboxIndicator,
  ComboboxEmpty,
};
