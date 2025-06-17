"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
  useState,
} from "react";
import type { FormEventHandler } from "react";
import useEffectEvent from "./use-effect-event";
import { Checkbox } from "./checkbox";

// Grid Data Types - for managing row data
type GridDataState = {
  rows: Array<{ rowId: string; readOnly?: boolean; disabled?: boolean }>;
};

type GridDataAction =
  | {
      type: "addRow";
      rowId: string;
      readOnly?: boolean;
      disabled?: boolean;
    }
  | {
      type: "removeRow";
      rowId: string;
    }
  | {
      type: "updateRow";
      rowId: string;
      readOnly?: boolean;
      disabled?: boolean;
    };

// Selection State Types - for managing selection
type SelectionState = {
  selectionMode: "none" | "single" | "multiple";
  selectedRows: Set<string>;
};

type SelectionAction =
  | {
      type: "selectRow";
      rowId: string;
    }
  | {
      type: "deselectRow";
      rowId: string;
    }
  | {
      type: "toggleRowSelection";
      rowId: string;
    }
  | {
      type: "clearSelection";
      rows?: Array<{ rowId: string; readOnly?: boolean; disabled?: boolean }>;
    }
  | {
      type: "selectAllRows";
      allRows: Array<{
        rowId: string;
        readOnly?: boolean;
        disabled?: boolean;
      }>;
    }
  | {
      type: "setSelectedRows";
      selectedRows: string[];
    };

// Grid State Types - for managing focus and navigation (selection removed)
type GridState = {
  lastFocusedRowId: string | null;
  isFocusWithinContainer: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  startRef?: React.RefObject<HTMLSpanElement | null>;
  endRef?: React.RefObject<HTMLSpanElement | null>;
  cycleRowFocus: boolean;
  name?: string;
  required?: boolean;
};

type GridAction =
  | {
      type: "setLastFocusedRow";
      rowId: string | null;
    }
  | {
      type: "setFocusWithinContainer";
      isFocusWithinContainer: boolean;
    };

const defaultGridDataState: GridDataState = {
  rows: [],
};

const defaultSelectionState: SelectionState = {
  selectionMode: "none",
  selectedRows: new Set(),
};

const defaultGridState: GridState = {
  lastFocusedRowId: null,
  isFocusWithinContainer: false,
  cycleRowFocus: false,
  name: undefined,
  required: false,
};

function gridDataReducer(
  state: GridDataState,
  action: GridDataAction,
): GridDataState {
  switch (action.type) {
    case "addRow":
      // check for existence before adding
      if (state.rows.some((row) => row.rowId === action.rowId)) {
        return state;
      }
      return {
        ...state,
        rows: [
          ...state.rows,
          {
            rowId: action.rowId,
            readOnly: action.readOnly,
            disabled: action.disabled,
          },
        ],
      };
    case "removeRow": {
      const newRows = state.rows.filter((row) => row.rowId !== action.rowId);
      return {
        ...state,
        rows: newRows,
      };
    }
    case "updateRow": {
      const newRows = state.rows.map((row) =>
        row.rowId === action.rowId
          ? { ...row, readOnly: action.readOnly, disabled: action.disabled }
          : row,
      );
      return {
        ...state,
        rows: newRows,
      };
    }
  }
  return state;
}

// Grid Data Provider
const [GridDataProvider, useGridDataState, useGridDataDispatch] =
  createReducerContext(gridDataReducer, defaultGridDataState);

function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
): SelectionState {
  switch (action.type) {
    case "selectRow": {
      const newSelectedRows = new Set(state.selectedRows);
      if (state.selectionMode === "single") {
        newSelectedRows.clear();
      }
      newSelectedRows.add(action.rowId);
      return {
        ...state,
        selectedRows: newSelectedRows,
      };
    }
    case "deselectRow": {
      const newSelectedRows = new Set(state.selectedRows);
      newSelectedRows.delete(action.rowId);
      return {
        ...state,
        selectedRows: newSelectedRows,
      };
    }

    case "toggleRowSelection": {
      const newSelectedRows = new Set(state.selectedRows);
      if (newSelectedRows.has(action.rowId)) {
        newSelectedRows.delete(action.rowId);
      } else {
        if (state.selectionMode === "single") {
          newSelectedRows.clear();
        }
        newSelectedRows.add(action.rowId);
      }
      return {
        ...state,
        selectedRows: newSelectedRows,
      };
    }

    case "clearSelection": {
      // Preserve read-only rows that are currently selected
      if (!action.rows) {
        return {
          ...state,
          selectedRows: new Set(),
        };
      }

      const readOnlyRowIds = action.rows
        .filter((row) => row.readOnly)
        .map((row) => row.rowId);

      const preservedReadOnlySelections = readOnlyRowIds.filter((rowId) =>
        state.selectedRows.has(rowId),
      );

      return {
        ...state,
        selectedRows: new Set(preservedReadOnlySelections),
      };
    }

    case "selectAllRows": {
      // Get selectable rows (not disabled and not read-only)
      const selectableRowIds = action.allRows
        .filter((row) => !row.disabled && !row.readOnly)
        .map((row) => row.rowId);

      // Start with the selectable rows to select
      const newSelectedRows = new Set(selectableRowIds);

      // Get read-only rows and preserve their previous selections
      const readOnlyRowIds = action.allRows
        .filter((row) => row.readOnly)
        .map((row) => row.rowId);

      // Add back any read-only rows that were previously selected
      for (const rowId of readOnlyRowIds) {
        if (state.selectedRows.has(rowId)) {
          newSelectedRows.add(rowId);
        }
      }

      return {
        ...state,
        selectedRows: newSelectedRows,
      };
    }

    case "setSelectedRows": {
      return {
        ...state,
        selectedRows: new Set(action.selectedRows),
      };
    }
  }

  return state;
}

// Selection State Provider
const [SelectionStateProvider, useSelectionState, useSelectionDispatch] =
  createReducerContext(selectionReducer, defaultSelectionState);

// Grid State Provider (focus and navigation only)
const [GridListStateProvider, useGridListState, useGridListDispatch] =
  createReducerContext((state: GridState, action: GridAction): GridState => {
    switch (action.type) {
      case "setLastFocusedRow":
        return {
          ...state,
          lastFocusedRowId: action.rowId,
        };
      case "setFocusWithinContainer":
        if (state.isFocusWithinContainer === action.isFocusWithinContainer) {
          return state;
        }
        return {
          ...state,
          isFocusWithinContainer: action.isFocusWithinContainer,
        };
    }

    return state;
  }, defaultGridState);

// Internal hook for accessing selected rows
function useSelectedRows() {
  const controlledValue = useContext(ControlledValueContext);
  const { selectedRows } = useSelectionState();
  return controlledValue == null ? selectedRows : new Set(controlledValue);
}

const RowContext = createContext<{
  rowId: string;
}>({
  rowId: "",
});

const GridListBodyContext = createContext<boolean>(false);

function useRegisterRow(rowId: string, readOnly?: boolean, disabled?: boolean) {
  const dispatch = useGridDataDispatch();
  const isInsideBody = useContext(GridListBodyContext);

  useEffect(() => {
    // Only register rows that are inside GridListBody
    if (!isInsideBody) return;

    dispatch({ type: "addRow", rowId, readOnly, disabled });

    return () => {
      dispatch({ type: "removeRow", rowId });
    };
  }, [dispatch, rowId, readOnly, disabled, isInsideBody]);

  useEffect(() => {
    if (!isInsideBody) return;

    dispatch({ type: "updateRow", rowId, readOnly, disabled });
  }, [dispatch, rowId, readOnly, disabled, isInsideBody]);
}

// Helper function to get all tabbable elements
function getTabbableElements(container: Element): HTMLElement[] {
  const tabbableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    "details",
    "summary",
    "[data-focus-scope-start]",
    "[data-focus-scope-end]",
  ].join(",");

  const elements = Array.from(
    container.querySelectorAll(tabbableSelectors),
  ) as HTMLElement[];

  return elements.filter((el) => {
    if (
      el.hasAttribute("data-focus-scope-start") ||
      el.hasAttribute("data-focus-scope-end")
    ) {
      return true;
    }

    const tabIndex = el.getAttribute("tabindex");
    return tabIndex !== "-1" && el.offsetParent !== null;
  });
}

// Helper function to get all tabbable elements on the page
function getAllTabbableElements(): HTMLElement[] {
  return getTabbableElements(document.body) as HTMLElement[];
}

type ValueOnChangeMode =
  | {
      selectionMode: "multiple";
      initialValue?: string[];
      value?: string[];
      onValueChange?: (value: string[]) => void;
    }
  | {
      selectionMode: "single";
      initialValue?: string;
      value?: string;
      onValueChange?: (value: string) => void;
    }
  | {
      selectionMode: "none";
      initialValue?: undefined;
      value?: undefined;
      onValueChange?: undefined;
    };

const ControlledValueContext = createContext<Set<string> | null>(null);

export function GridListRoot({
  children,
  className,
  cycleRowFocus = false,
  selectionMode = "none",
  name,
  required = false,
  initialValue,
  value,
  onValueChange,
  onInvalid,
  ...divProps
}: {
  children: React.ReactNode;
  cycleRowFocus?: boolean;
  selectionMode?: "none" | "single" | "multiple";
  name?: string;
  required?: boolean;
  onInvalid?: FormEventHandler<HTMLSelectElement>;
} & React.HTMLAttributes<HTMLDivElement> &
  ValueOnChangeMode) {
  const isControlled = typeof value !== "undefined";
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const onValueChangeEvent = useEffectEvent((value: string | string[]) => {
    if (typeof onValueChange === "function") {
      // biome-ignore lint/suspicious/noExplicitAny: we know if this is a string or string[] already
      onValueChange(value as any);
    }
  });

  // Create initial selectedRows set based on initialValue (only used once, not reactive)
  const [initialSelectedRows] = useState(() => {
    const actualInitialValue =
      typeof value !== "undefined" ? value : initialValue;

    if (!actualInitialValue || selectionMode === "none") {
      return new Set<string>();
    }

    if (selectionMode === "single") {
      return typeof actualInitialValue === "string"
        ? new Set<string>([actualInitialValue])
        : new Set<string>();
    }

    if (selectionMode === "multiple") {
      return Array.isArray(actualInitialValue)
        ? new Set<string>(actualInitialValue)
        : new Set<string>();
    }

    return new Set<string>();
  });

  const selectionMiddleware = useCallback(
    (
      dispatch: ReturnType<typeof useSelectionDispatch>,
      getNextState: (action: SelectionAction) => SelectionState,
    ) =>
      (action: SelectionAction) => {
        // If controlled, don't dispatch to internal state
        if (typeof value !== "undefined") {
          // apply the reducer logic on the controlled state
          const state = selectionReducer(
            {
              selectionMode,
              selectedRows: new Set(value),
            },
            action,
          );

          const selectedArray = Array.from(state.selectedRows);
          onValueChangeEvent(
            selectionMode === "multiple"
              ? selectedArray
              : selectedArray[0] || "",
          );

          return;
        }

        // Apply the action to get the next state
        dispatch(action);
        const state = getNextState(action);
        console.log("not controlled", state);
        const selectedArray = Array.from(state.selectedRows);
        onValueChangeEvent(
          selectionMode === "multiple" ? selectedArray : selectedArray[0] || "",
        );
      },
    [onValueChangeEvent, selectionMode, value],
  );

  const reactiveValue = useMemo(() => {
    if (typeof value === "undefined") return new Set<string>();
    if (Array.isArray(value)) return new Set<string>(value);
    return new Set<string>([value]);
  }, [value]);

  const listInner = (
    <GridListInner className={className} {...divProps}>
      <span data-focus-scope-start hidden tabIndex={-1} ref={startRef} />
      {children}
      <span data-focus-scope-end hidden tabIndex={-1} ref={endRef} />
      <HiddenSelectionInput selectRef={selectRef} onInvalid={onInvalid} />
    </GridListInner>
  );

  const optionalControlled = isControlled ? (
    <ControlledValueContext value={reactiveValue}>
      {listInner}
    </ControlledValueContext>
  ) : (
    listInner
  );

  return (
    <GridDataProvider>
      <SelectionStateProvider
        selectionMode={selectionMode}
        selectedRows={initialSelectedRows}
        middleware={selectionMiddleware}
      >
        <GridListStateProvider
          startRef={startRef}
          endRef={endRef}
          containerRef={containerRef}
          cycleRowFocus={cycleRowFocus}
          name={name}
          required={required}
        >
          {optionalControlled}
        </GridListStateProvider>
      </SelectionStateProvider>
    </GridDataProvider>
  );
}

function GridListInner({
  children,
  className,
  ...divProps
}: {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { containerRef, isFocusWithinContainer } = useGridListState();
  const dispatch = useGridListDispatch();
  const { lastFocusedRowId } = useGridListState();

  const focusRow = useFocusRow();
  // Helper function to focus the first row
  const focusFirstRow = useFocusFirstRow();

  // Effect to validate the currently focused row still exists
  useEffect(() => {
    if (!lastFocusedRowId || !containerRef?.current) return;

    const rowElement = containerRef.current.querySelector(
      `[data-row-id="${lastFocusedRowId}"]`,
    );
    if (!rowElement) {
      // If the focused row no longer exists, clear the focus
      dispatch({
        type: "setLastFocusedRow",
        rowId: null,
      });
    }
  }, [lastFocusedRowId, containerRef, dispatch]);

  useHandleTab();
  useHandleShiftTab();
  useHandleUpArrow();
  useHandleDownArrow();
  useHandleLeftArrow();
  useHandleRightArrow();
  useHandleSpacebar();

  // Focus management for entering the grid
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      if (!target || !container.contains(target)) return;

      // Set focus within container to true
      dispatch({
        type: "setFocusWithinContainer",
        isFocusWithinContainer: true,
      });

      // Track which row is currently focused
      const rowElement = target.closest("[data-row-id]");
      if (rowElement) {
        const rowId = rowElement.getAttribute("data-row-id");
        if (rowId && rowId !== lastFocusedRowId) {
          if (focusRow(rowId)) {
            return;
          }
        }
      }

      // Check if focus is coming from outside the grid
      const relatedTarget = event.relatedTarget as Element;
      const focusComingFromOutside =
        !relatedTarget || !container.contains(relatedTarget);

      if (focusComingFromOutside) {
        // Try to restore focus to the previously focused row
        if (lastFocusedRowId && focusRow(lastFocusedRowId)) {
          return;
        }
        // If no previously focused row or it doesn't exist, focus the first row
        focusFirstRow();
        return;
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as Element;
      const relatedTarget = event.relatedTarget as Element;

      // Check if focus is leaving the container
      if (
        target &&
        container.contains(target) &&
        (!relatedTarget || !container.contains(relatedTarget))
      ) {
        dispatch({
          type: "setFocusWithinContainer",
          isFocusWithinContainer: false,
        });
      }
    };

    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);

    return () => {
      container.removeEventListener("focusin", handleFocusIn);
      container.removeEventListener("focusout", handleFocusOut);
    };
  }, [lastFocusedRowId, focusRow, focusFirstRow, dispatch, containerRef]);

  const innerProps = {
    ...divProps,
    className: cn("grid", className),
    role: "grid",
    tabIndex: -1,
    "data-focused": isFocusWithinContainer ? "true" : undefined,
  };

  return (
    <div {...innerProps} ref={containerRef}>
      <GridListTabIndexManager>{children}</GridListTabIndexManager>
    </div>
  );
}

function HiddenSelectionInput({
  selectRef,
  onInvalid,
}: {
  selectRef: React.RefObject<HTMLSelectElement | null>;
  onInvalid?: FormEventHandler<HTMLSelectElement>;
}) {
  const { selectionMode } = useSelectionState();
  const { name, required } = useGridListState();
  const selectedRows = useSelectedRows();

  if (selectionMode === "none" || !name) {
    return null;
  }

  const selectedArray = Array.from(selectedRows);
  const isMultiple = selectionMode === "multiple";
  const selectValue = isMultiple ? selectedArray : selectedArray[0] || "";

  return (
    <select
      hidden
      ref={selectRef}
      name={name}
      multiple={isMultiple}
      value={selectValue}
      onChange={() => {}}
      onInvalid={onInvalid}
      required={required}
      tabIndex={-1}
      aria-hidden="true"
    >
      {selectedArray.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}

const SelectionIndicatorContext = createContext<{
  selected: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
}>({
  selected: false,
  onCheckedChange: () => {},
});

export function GridListHeader({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const dispatch = useSelectionDispatch();
  const { rows } = useGridDataState();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();

  const headerElem = (
    <header
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...divProps}
    >
      {children}
    </header>
  );

  // only wrap the context if we are in multiple selection mode
  if (selectionMode !== "multiple") {
    return headerElem;
  }

  // Only consider selectable rows (not disabled or read-only)
  const selectableRows = rows.filter((row) => !row.disabled && !row.readOnly);
  const selectableRowIds = selectableRows.map((row) => row.rowId);

  // Count how many selectable rows are currently selected
  const selectedSelectableRowsCount = selectableRowIds.filter((rowId) =>
    selectedRows.has(rowId),
  ).length;

  const isEmpty = selectedSelectableRowsCount === 0;
  const isAllSelected =
    !isEmpty && selectedSelectableRowsCount === selectableRows.length;

  const isIndeterminate = !isEmpty && !isAllSelected;

  return (
    <SelectionIndicatorContext
      value={{
        selected: isIndeterminate ? "indeterminate" : isAllSelected,
        onCheckedChange: (isCheckingEverything) => {
          // if isCheckingEverything is true, we need to check all selectable rows. Otherwise, we need to uncheck all rows.
          if (isCheckingEverything) {
            dispatch({
              type: "selectAllRows",
              allRows: rows,
            });
          } else {
            dispatch({ type: "clearSelection", rows });
          }
        },
      }}
    >
      {headerElem}
    </SelectionIndicatorContext>
  );
}

export function GridListBody({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <GridListBodyContext value={true}>
      <div
        className={cn("grid col-span-full grid-cols-subgrid", className)}
        {...divProps}
      >
        {children}
      </div>
    </GridListBodyContext>
  );
}

export function GridListFooter({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <footer
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...divProps}
    >
      {children}
    </footer>
  );
}

export const GridListRow = memo(function GridListRow({
  children,
  className,
  asChild,
  rowId,
  readOnly,
  disabled,
  ...divProps
}: {
  children: React.ReactNode;
  asChild?: boolean;
  rowId?: string;
  readOnly?: boolean;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const state = useGridListState();
  const selectionDispatch = useSelectionDispatch();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();
  const isLastFocusedRow = state.lastFocusedRowId === rowId;

  const autoGeneratedRowId = useId();
  const actualRowId = rowId ?? autoGeneratedRowId;

  // Only show as focused when the row element itself is the active element
  const isFocused =
    isLastFocusedRow &&
    state.isFocusWithinContainer &&
    document.activeElement?.getAttribute("data-row-id") === rowId;

  // Check if row is selected
  const isRowSelected =
    selectionMode !== "none" && selectedRows.has(actualRowId);

  const rowProps: React.HTMLAttributes<HTMLDivElement> & {
    "data-row-id": string;
    "data-focused"?: string;
    "data-restore-focus"?: string;
    "data-selected"?: string;
    "data-readonly"?: string;
    "data-disabled"?: string;
  } = {
    ...divProps,
    role: "row",
    tabIndex: disabled ? -1 : isLastFocusedRow ? 0 : -1,
    className: cn("grid col-span-full grid-cols-subgrid", className),
    "data-row-id": actualRowId,
    "data-focused": isFocused ? "true" : undefined,
    "data-restore-focus": isLastFocusedRow ? "true" : undefined,
    "data-selected": isRowSelected ? "true" : undefined,
    "data-readonly": readOnly ? "true" : undefined,
    "data-disabled": disabled ? "true" : undefined,
  };

  useRegisterRow(actualRowId, readOnly, disabled);

  const rowContextValue = useMemo(() => {
    return {
      rowId: actualRowId,
    };
  }, [actualRowId]);

  const rowElem = asChild ? (
    <Slot {...rowProps}>{children}</Slot>
  ) : (
    <div {...rowProps}>{children}</div>
  );

  const contextWrappedElem = (
    <RowContext value={rowContextValue}>{rowElem}</RowContext>
  );

  if (selectionMode === "none") {
    return contextWrappedElem;
  }

  const selectionCtxValue = useMemo(() => {
    return {
      selected: isRowSelected,
      onCheckedChange: () => {
        if (disabled || readOnly) return;
        console.log(
          "onCheckedChange #%s : %s -> %s",
          actualRowId,
          isRowSelected,
          !isRowSelected,
        );
        if (isRowSelected) {
          selectionDispatch({ type: "deselectRow", rowId: actualRowId });
        } else {
          selectionDispatch({ type: "selectRow", rowId: actualRowId });
        }
      },
    };
  }, [selectionDispatch, actualRowId, isRowSelected, disabled, readOnly]);

  return (
    <SelectionIndicatorContext value={selectionCtxValue}>
      {contextWrappedElem}
    </SelectionIndicatorContext>
  );
});

export function GridListItemIndicatorRoot({
  children,
  className,
  ...buttonProps
}: {
  children?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const rowContext = useContext(RowContext);

  if (!rowContext) {
    throw new Error(
      "GridListItemIndicatorRoot must be used within a GridListRow",
    );
  }

  const { selected, onCheckedChange } = useContext(SelectionIndicatorContext);

  if (!children) {
    // render default checkbox
    return <Checkbox checked={selected} onCheckedChange={onCheckedChange} />;
  }

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer border-none bg-transparent p-0 m-0",
        className,
      )}
      onClick={(event) => {
        onCheckedChange(selected === "indeterminate" ? false : !selected);
        buttonProps.onClick?.(event);
      }}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

function IndicatorState({
  children,
  when,
}: {
  children: React.ReactNode;
  when: "selected" | "unselected" | "indeterminate";
}) {
  const { selected } = useContext(SelectionIndicatorContext);
  const isIndeterminate = selected === "indeterminate";

  const shouldShow =
    (when === "selected" && selected && !isIndeterminate) ||
    (when === "unselected" && !selected && !isIndeterminate) ||
    (when === "indeterminate" && selected === "indeterminate");

  if (!shouldShow) {
    return null;
  }

  return <>{children}</>;
}

export function GridListItemSelectedIndicator({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IndicatorState when="selected">{children}</IndicatorState>;
}

export function GridListItemUnselectedIndicator({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IndicatorState when="unselected">{children}</IndicatorState>;
}

export function GridListItemIndeterminateIndicator({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IndicatorState when="indeterminate">{children}</IndicatorState>;
}

export const Debugger = memo(function Debugger() {
  const { isFocusWithinContainer, lastFocusedRowId, cycleRowFocus } =
    useGridListState();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();

  return (
    <GridListRow>
      <dl className="text-sm bg-muted/50 p-1 rounded-md text-muted-foreground flex flex-row gap-8 col-span-full">
        <BooleanValue label="cycleRowFocus" value={cycleRowFocus} />
        <TextValue label="lastFocusedRowId" value={lastFocusedRowId} />
        <BooleanValue
          label="isFocusWithinContainer"
          value={isFocusWithinContainer}
        />
        <TextValue label="selectionMode" value={selectionMode} />
        <TextValue
          label="selectedRows"
          value={Array.from(selectedRows).join(", ") || "none"}
        />
      </dl>
    </GridListRow>
  );
});

function TextValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value == null) {
    return (
      <div className="flex flex-row gap-2 bg-muted items-center">
        <dt className="tracking-tight font-semibold">{label}</dt>
        <dd className="italic font-mono">NULL</dd>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 bg-muted items-center">
      <dt className="tracking-tight font-semibold">{label}</dt>
      <dd className="font-mono">{JSON.stringify(value)}</dd>
    </div>
  );
}

function BooleanValue({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex flex-row gap-2 bg-muted items-center">
      <dt className="tracking-tight font-semibold">{label}</dt>
      <dd>
        <div
          className={cn(
            "size-3 text-transparent overflow-hidden rounded-full",
            value ? "bg-green-500" : "bg-red-500",
          )}
        >
          {value ? "true" : "false"}
        </div>
      </dd>
    </div>
  );
}

function useHandleTab() {
  const { endRef, containerRef } = useGridListState();
  useEffect(() => {
    const sentinelEnd = endRef?.current;
    if (!sentinelEnd) {
      return;
    }

    const container = containerRef?.current;
    if (!container) {
      return;
    }

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      if (event.shiftKey) {
        return;
      }

      event.preventDefault();
      const allTabbableElements = getAllTabbableElements();

      if (!sentinelEnd) {
        console.error("sentinel end is not defined");
        // this can't happen
        return;
      }

      const sentinelEndIndex = allTabbableElements.indexOf(sentinelEnd);
      const lookupIndex = sentinelEndIndex + 1;

      if (sentinelEndIndex === -1) {
        console.error("sentinel end is not in the list of tabbable elements");
        // this can't happen
        return;
      }

      // find the first tabbable element after the sentinel end
      const firstTabbableElementAfterSentinelEnd =
        allTabbableElements[lookupIndex];

      // if the grid is the last tabbable element, focus the first tabbable element
      if (!firstTabbableElementAfterSentinelEnd) {
        allTabbableElements[0]?.focus();
        return;
      }

      // if the next tabbable element is a start sentinel, we need to focus on its last focused row or first row
      if (
        firstTabbableElementAfterSentinelEnd.hasAttribute(
          "data-focus-scope-start",
        )
      ) {
        const container =
          firstTabbableElementAfterSentinelEnd.closest("[role='grid']");
        if (container && safelyFocusElement(container)) {
          return;
        }
      }

      firstTabbableElementAfterSentinelEnd?.focus();
    };

    container.addEventListener("keydown", handleTab);

    return () => {
      container.removeEventListener("keydown", handleTab);
    };
  }, [endRef, containerRef]);
}

function useHandleShiftTab() {
  const { startRef, containerRef } = useGridListState();
  useEffect(() => {
    const sentinelStart = startRef?.current;
    if (!sentinelStart) {
      return;
    }

    const container = containerRef?.current;
    if (!container) {
      return;
    }

    const handleShiftTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      if (!event.shiftKey) {
        return;
      }

      event.preventDefault();
      const allTabbableElements = getAllTabbableElements();

      const sentinelStartIndex = allTabbableElements.indexOf(sentinelStart);
      const lookupIndex = sentinelStartIndex - 1;

      if (sentinelStartIndex === -1) {
        console.error("sentinel start is not in the list of tabbable elements");
        // this can't happen
        return;
      }

      // find the first tabbable element before the sentinel start
      const lastTabbableElementBeforeSentinelStart =
        allTabbableElements[lookupIndex];

      // if the grid is the first tabbable element, focus the last tabbable element
      if (!lastTabbableElementBeforeSentinelStart) {
        allTabbableElements[allTabbableElements.length - 1]?.focus();
        return;
      }

      // if the last tabbable element is an end sentinel, we need to focus on its container
      if (
        lastTabbableElementBeforeSentinelStart.hasAttribute(
          "data-focus-scope-end",
        )
      ) {
        const container =
          lastTabbableElementBeforeSentinelStart.closest("[role='grid']");

        if (container && safelyFocusElement(container)) {
          return;
        }
      }

      lastTabbableElementBeforeSentinelStart?.focus();
    };

    container.addEventListener("keydown", handleShiftTab);

    return () => {
      container.removeEventListener("keydown", handleShiftTab);
    };
  }, [startRef, containerRef]);
}

function useHandleUpArrow() {
  const { containerRef, cycleRowFocus } = useGridListState();
  const focusRow = useFocusRow();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleUpArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      // find previous row using selector (exclude disabled rows)
      const allRows = container.querySelectorAll(
        "[data-row-id]:not([data-disabled='true'])",
      );

      const currentRowIndex = Array.from(allRows).findIndex(
        (row) => row === currentRowElement,
      );
      if (currentRowIndex === -1) return;

      const targetRowIndex = currentRowIndex - 1;

      // If we're at the first row and cycling is enabled, go to the last row
      if (targetRowIndex < 0) {
        if (cycleRowFocus && allRows.length > 0) {
          const lastRow = allRows[allRows.length - 1];
          const id = lastRow.getAttribute("data-row-id");
          if (id) {
            focusRow(id);
          }
        }
        return;
      }

      const targetRow = allRows[targetRowIndex];

      const id = targetRow.getAttribute("data-row-id");
      if (!id) return;

      focusRow(id);
    };

    container.addEventListener("keydown", handleUpArrow);

    return () => {
      container.removeEventListener("keydown", handleUpArrow);
    };
  }, [containerRef, focusRow, cycleRowFocus]);
}

function useHandleDownArrow() {
  const { containerRef, cycleRowFocus } = useGridListState();
  const focusRow = useFocusRow();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleDownArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown") {
        return;
      }

      event.preventDefault();

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const allRows = container.querySelectorAll(
        "[data-row-id]:not([data-disabled='true'])",
      );
      const currentRowIndex = Array.from(allRows).findIndex(
        (row) => row === currentRowElement,
      );
      if (currentRowIndex === -1) return;

      const targetRowIndex = currentRowIndex + 1;

      // If we're at the last row and cycling is enabled, go to the first row
      if (targetRowIndex >= allRows.length) {
        if (cycleRowFocus && allRows.length > 0) {
          const firstRow = allRows[0];
          const id = firstRow.getAttribute("data-row-id");
          if (id) {
            focusRow(id);
          }
        }
        return;
      }

      const targetRow = allRows[targetRowIndex];
      const id = targetRow.getAttribute("data-row-id");
      if (!id) return;

      focusRow(id);
    };

    container.addEventListener("keydown", handleDownArrow);

    return () => {
      container.removeEventListener("keydown", handleDownArrow);
    };
  }, [containerRef, focusRow, cycleRowFocus]);
}

function useHandleLeftArrow() {
  const { containerRef } = useGridListState();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleLeftArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const allTabbableElements = getTabbableElements(currentRowElement);
      if (allTabbableElements.length === 0) return;

      // Check if currently focused element is the row itself
      const isRowFocused = activeElement === currentRowElement;

      if (isRowFocused) {
        // If row is focused, go to the last tabbable element
        const lastElement = allTabbableElements[allTabbableElements.length - 1];
        if (lastElement) {
          lastElement.focus();
        }
        return;
      }

      const currentTabbableIndex = allTabbableElements.indexOf(
        activeElement as HTMLElement,
      );
      if (currentTabbableIndex === -1) {
        // focus the first tabbable element
        allTabbableElements[0]?.focus();
        return;
      }

      const targetTabbableIndex = currentTabbableIndex - 1;
      if (targetTabbableIndex < 0) {
        // Cycle back to the row element
        if (currentRowElement instanceof HTMLElement) {
          currentRowElement.focus();
        }
        return;
      }

      const targetTabbableElement = allTabbableElements[targetTabbableIndex];
      if (!targetTabbableElement) return;

      targetTabbableElement.focus();
    };

    container.addEventListener("keydown", handleLeftArrow);

    return () => {
      container.removeEventListener("keydown", handleLeftArrow);
    };
  }, [containerRef]);
}

function useHandleRightArrow() {
  const { containerRef } = useGridListState();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleRightArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const allTabbableElements = getTabbableElements(currentRowElement);
      if (allTabbableElements.length === 0) return;

      // Check if currently focused element is the row itself
      const isRowFocused = activeElement === currentRowElement;

      if (isRowFocused) {
        // If row is focused, go to the first tabbable element
        const firstElement = allTabbableElements[0];
        if (firstElement) {
          firstElement.focus();
        }
        return;
      }

      const currentTabbableIndex = allTabbableElements.indexOf(
        activeElement as HTMLElement,
      );
      if (currentTabbableIndex === -1) {
        // focus the last tabbable element
        allTabbableElements[allTabbableElements.length - 1]?.focus();
        return;
      }

      const targetTabbableIndex = currentTabbableIndex + 1;
      if (targetTabbableIndex >= allTabbableElements.length) {
        // Cycle back to the row element
        if (currentRowElement instanceof HTMLElement) {
          currentRowElement.focus();
        }
        return;
      }

      const targetTabbableElement = allTabbableElements[targetTabbableIndex];
      if (!targetTabbableElement) return;

      targetTabbableElement.focus();
    };

    container.addEventListener("keydown", handleRightArrow);

    return () => {
      container.removeEventListener("keydown", handleRightArrow);
    };
  }, [containerRef]);
}

function useHandleSpacebar() {
  const { containerRef } = useGridListState();
  const { selectionMode } = useSelectionState();
  const { rows } = useGridDataState();
  const dispatch = useSelectionDispatch();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container || selectionMode === "none") return;

    const handleSpacebar = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Spacebar") {
        return;
      }

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const rowId = currentRowElement.getAttribute("data-row-id");
      if (!rowId) return;

      // Check if currently focused element is the row itself
      const isRowFocused = activeElement === currentRowElement;
      if (!isRowFocused) return;

      // Find the row data to check if it's read-only or disabled
      const rowData = rows.find((row) => row.rowId === rowId);
      if (rowData?.disabled || rowData?.readOnly) {
        return;
      }

      event.preventDefault();

      // Toggle row selection
      dispatch({ type: "toggleRowSelection", rowId });
    };

    container.addEventListener("keydown", handleSpacebar);

    return () => {
      container.removeEventListener("keydown", handleSpacebar);
    };
  }, [containerRef, selectionMode, rows, dispatch]);
}

function safelyFocusElement(element: Element): boolean {
  if (element instanceof HTMLElement && element.focus) {
    element.focus();
    return true;
  }

  return false;
}

function useFocusRow() {
  const { containerRef } = useGridListState();
  const dispatch = useGridListDispatch();

  return (rowId: string): boolean => {
    const container = containerRef?.current;
    if (!container) return false;

    const rowElement = container.querySelector(`[data-row-id="${rowId}"]`);
    if (!rowElement) {
      // If the row doesn't exist, clear the focus
      dispatch({
        type: "setLastFocusedRow",
        rowId: null,
      });
      return false;
    }

    // Check if the row is disabled
    const isDisabled = rowElement.getAttribute("data-disabled") === "true";
    if (isDisabled) {
      return false;
    }

    if (safelyFocusElement(rowElement)) {
      dispatch({
        type: "setLastFocusedRow",
        rowId,
      });

      return true;
    }

    return false;
  };
}

function useFocusFirstRow() {
  const { containerRef } = useGridListState();
  const focusRow = useFocusRow();

  return () => {
    const container = containerRef?.current;
    if (!container) return;

    // Find the first non-disabled row
    const rows = container.querySelectorAll("[data-row-id]");
    for (const row of rows) {
      const isDisabled = row.getAttribute("data-disabled") === "true";
      if (isDisabled) continue;

      const id = row.getAttribute("data-row-id");
      if (!id) continue;

      if (focusRow(id)) {
        break;
      }
    }
  };
}

function GridListTabIndexManager({ children }: { children: React.ReactNode }) {
  const { containerRef } = useGridListState();
  const { rows } = useGridDataState();

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to re-run this effect when the children change
  useLayoutEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    // set tabIndex=0 for the first non-disabled row
    const firstRow = container.querySelector(
      "[data-row-id]:not([data-disabled='true'])",
    );
    if (firstRow) {
      firstRow.setAttribute("tabindex", "0");
    }

    return () => {
      const firstRow = container.querySelector(
        "[data-row-id]:not([data-disabled='true'])",
      );
      if (firstRow) {
        firstRow.setAttribute("tabindex", "-1");
      }
    };
  }, [children, rows]);

  return <>{children}</>;
}

function arr(value: string | string[] | undefined): string[] {
  if (typeof value === "undefined") return [];
  if (Array.isArray(value)) return value;
  return [value];
}
