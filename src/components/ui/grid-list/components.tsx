"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import {
  useContext,
  useEffect,
  useId,
  useCallback,
  memo,
  useMemo,
  useState,
  useRef,
} from "react";
import type { FormEventHandler } from "react";
import useEffectEvent from "../use-effect-event";
import { Checkbox } from "../checkbox";
import type { SelectionAction, SelectionState } from "./types";
import type {
  GridListRootProps,
  GridListRowProps,
  GridListColumnHeaderProps,
  GridListRowHeaderProps,
  GridListTitleProps,
  GridListCaptionProps,
  GridListCellProps,
} from "./types";
import {
  GridDataProvider,
  SelectionStateProvider,
  GridListStateProvider,
  GridLabelingProvider,
  ControlledValueContext,
  RowContext,
  GridListBodyContext,
  SelectionIndicatorContext,
  useSelectionState,
  useSelectedRows,
  useGridDataState,
  useSelectionDispatch,
  useGridListState,
  useGridListDispatch,
  useGridLabelingState,
  useGridLabelingDispatch,
  selectionReducer,
} from "./state";
import {
  useRegisterRow,
  useFocusRow,
  useFocusFirstRow,
  useHandleTab,
  useHandleShiftTab,
  useHandleUpArrow,
  useHandleDownArrow,
  useHandleLeftArrow,
  useHandleRightArrow,
  useHandleSpacebar,
  useGridListTabIndexManager,
} from "./hooks";

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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  ...divProps
}: GridListRootProps) {
  const isControlled = typeof value !== "undefined";
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const onValueChangeEvent = useEffectEvent((rows: Set<string>) => {
    if (typeof onValueChange === "function") {
      const selectedArray = Array.from(rows);
      const valueToEmit =
        selectionMode === "multiple" ? selectedArray : selectedArray[0] || "";

      // biome-ignore lint/suspicious/noExplicitAny: we know if this is a string or string[] already
      onValueChange(valueToEmit as any);
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

          onValueChangeEvent(state.selectedRows);

          return;
        }

        // Apply the action to get the next state
        dispatch(action);
        const state = getNextState(action);

        onValueChangeEvent(state.selectedRows);
      },
    [onValueChangeEvent, selectionMode, value],
  );

  const reactiveValue = useMemo(() => {
    if (typeof value === "undefined") return new Set<string>();
    if (Array.isArray(value)) return new Set<string>(value);
    return new Set<string>([value]);
  }, [value]);

  const listInner = (
    <GridListInner
      className={className}
      ariaLabel={ariaLabel}
      ariaLabelledby={ariaLabelledby}
      ariaDescribedby={ariaDescribedby}
      {...divProps}
    >
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
          <GridLabelingProvider>{optionalControlled}</GridLabelingProvider>
        </GridListStateProvider>
      </SelectionStateProvider>
    </GridDataProvider>
  );
}

function GridListInner({
  children,
  className,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  ...divProps
}: {
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
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

  const { labelIds, captionIds } = useGridLabelingState();

  // Combine manual ARIA props with registered label/caption IDs
  const combinedLabelledBy =
    [...(ariaLabelledby ? ariaLabelledby.split(/\s+/) : []), ...labelIds]
      .filter(Boolean)
      .join(" ") || undefined;

  const combinedDescribedBy =
    [...(ariaDescribedby ? ariaDescribedby.split(/\s+/) : []), ...captionIds]
      .filter(Boolean)
      .join(" ") || undefined;

  const innerProps = {
    ...divProps,
    className: cn("grid", className),
    role: "grid",
    tabIndex: -1,
    "data-focused": isFocusWithinContainer ? "true" : undefined,
    "aria-label": ariaLabel,
    "aria-labelledby": combinedLabelledBy,
    "aria-describedby": combinedDescribedBy,
  };

  useGridListTabIndexManager(children);

  return (
    <div {...innerProps} ref={containerRef}>
      {children}
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
  const { name, required, lastFocusedRowId } = useGridListState();
  const selectedRows = useSelectedRows();

  if (!name) {
    return null;
  }

  const selectedArray = Array.from(selectedRows);
  const isMultiple = selectionMode === "multiple";
  const selectValue = isMultiple ? selectedArray : selectedArray[0] || "";

  return (
    <>
      {selectionMode !== "none" && (
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
      )}
      {lastFocusedRowId && (
        <input
          hidden
          name={`${name}.focused`}
          value={lastFocusedRowId}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </>
  );
}

export function GridListHeader({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const dispatch = useSelectionDispatch();
  const { rows } = useGridDataState();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();

  const headerProps = {
    ...divProps,
    role: "rowgroup",
  };

  const headerElem = (
    <header
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...headerProps}
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
  const bodyProps = {
    ...divProps,
    role: "rowgroup",
  };
  return (
    <GridListBodyContext value={true}>
      <div
        className={cn("grid col-span-full grid-cols-subgrid", className)}
        {...bodyProps}
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
  const footerProps = {
    ...divProps,
    role: "rowgroup",
  };
  return (
    <footer
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...footerProps}
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
  rowData,
  ...divProps
}: GridListRowProps) {
  const state = useGridListState();
  const selectionDispatch = useSelectionDispatch();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();
  const isInBody = useContext(GridListBodyContext);
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
    "aria-selected": selectionMode !== "none" ? isRowSelected : undefined,
    // FIXME: HIGH PRIORITY - Add aria-readonly support for WAI-ARIA compliance
    // When readOnly is true, should add "aria-readonly": true
    // FIXME: HIGH PRIORITY - Add individual cell roles for proper grid structure
    // Need to either:
    // 1. Create GridListCell components with role="gridcell", "columnheader", or "rowheader"
    // 2. Or automatically assign cell roles to direct children of rows
    // Each cell should have appropriate role based on its purpose
    "data-row-id": actualRowId,
    "data-focused": isFocused ? "true" : undefined,
    "data-restore-focus": isLastFocusedRow ? "true" : undefined,
    "data-selected": isRowSelected ? "true" : undefined,
    "data-readonly": readOnly ? "true" : undefined,
    "data-disabled": disabled ? "true" : undefined,
  };

  useRegisterRow(actualRowId, readOnly, disabled, rowData);

  const rowContextValue = useMemo(() => {
    return {
      rowId: actualRowId,
      data: rowData,
    };
  }, [actualRowId, rowData]);

  const rowElem = (
    <RowInner asChild={asChild} {...rowProps}>
      {children}
    </RowInner>
  );

  const contextWrappedElem = (
    <RowContext value={rowContextValue}>{rowElem}</RowContext>
  );

  // Only provide SelectionIndicatorContext for rows inside GridListBody
  if (selectionMode === "none" || !isInBody) {
    return contextWrappedElem;
  }

  const selectionCtxValue = useMemo(() => {
    return {
      selected: isRowSelected,
      onCheckedChange: () => {
        if (disabled || readOnly) return;

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

function RowInner({
  children,
  asChild,
  ...divProps
}: {
  children: React.ReactNode;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const rowRef = useRef<HTMLDivElement>(null);
  useHandleSpacebar(rowRef);

  const rowProps: React.HTMLAttributes<HTMLDivElement> = {
    ...divProps,
  };

  const rowElem = asChild ? (
    <Slot ref={rowRef} {...rowProps}>
      {children}
    </Slot>
  ) : (
    <div ref={rowRef} {...rowProps}>
      {children}
    </div>
  );

  return rowElem;
}

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

export function GridListColumnHeader({
  children,
  className,
  sortable = false,
  sortDirection = "none",
  onSort,
  colSpan,
  asChild,
  ...divProps
}: GridListColumnHeaderProps) {
  const handleSort = useCallback(() => {
    if (sortable && onSort) {
      onSort();
    }
  }, [sortable, onSort]);

  const headerProps: React.HTMLAttributes<HTMLDivElement> & {
    "aria-sort"?: "ascending" | "descending" | "none";
    "aria-colspan"?: number;
    "data-sortable"?: string;
    "data-sort-direction"?: string;
  } = {
    ...divProps,
    role: "columnheader",
    className: cn(sortable && "cursor-pointer", className),
    tabIndex: sortable ? 0 : undefined,
    onClick: sortable ? handleSort : divProps.onClick,
    onKeyDown: sortable
      ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSort();
          }
          divProps.onKeyDown?.(event);
        }
      : divProps.onKeyDown,
    "aria-sort": sortable ? sortDirection : undefined,
    "data-sortable": sortable ? "true" : undefined,
    "data-sort-direction": sortDirection !== "none" ? sortDirection : undefined,
  };

  // Add colspan if specified
  if (colSpan && colSpan > 1) {
    headerProps["aria-colspan"] = colSpan;
  }

  if (asChild) {
    return <Slot {...headerProps}>{children}</Slot>;
  }

  return <div {...headerProps}>{children}</div>;
}

export function GridListTitle({
  children,
  className,
  asChild,
  ...headingProps
}: GridListTitleProps) {
  const id = useId();
  const dispatch = useGridLabelingDispatch();

  // Register this title ID when component mounts
  useEffect(() => {
    dispatch({ type: "addLabel", id });
    return () => {
      dispatch({ type: "removeLabel", id });
    };
  }, [dispatch, id]);

  const titleProps = {
    ...headingProps,
    id,
    className: cn("text-lg font-semibold col-span-full", className),
  };

  if (asChild) {
    return <Slot {...titleProps}>{children}</Slot>;
  }

  return <h2 {...titleProps}>{children}</h2>;
}

export function GridListCaption({
  children,
  className,
  asChild,
  ...divProps
}: GridListCaptionProps) {
  const id = useId();
  const dispatch = useGridLabelingDispatch();

  // Register this caption ID when component mounts
  useEffect(() => {
    dispatch({ type: "addCaption", id });
    return () => {
      dispatch({ type: "removeCaption", id });
    };
  }, [dispatch, id]);

  const captionProps = {
    ...divProps,
    id,
    className: cn("text-sm text-muted-foreground col-span-full", className),
  };

  if (asChild) {
    return <Slot {...captionProps}>{children}</Slot>;
  }

  return <div {...captionProps}>{children}</div>;
}

export function GridListRowHeader({
  children,
  className,
  rowSpan,
  scope = "row",
  asChild,
  ...divProps
}: GridListRowHeaderProps) {
  const headerProps: React.HTMLAttributes<HTMLDivElement> & {
    "aria-rowspan"?: number;
    scope?: "row" | "rowgroup";
  } = {
    ...divProps,
    role: "rowheader",
    scope,
    className: cn("font-medium text-left", className),
  };

  // Add rowspan if specified
  if (rowSpan && rowSpan > 1) {
    headerProps["aria-rowspan"] = rowSpan;
  }

  if (asChild) {
    return <Slot {...headerProps}>{children}</Slot>;
  }

  return <div {...headerProps}>{children}</div>;
}

export function GridListCell({
  children,
  className,
  asChild,
  ...divProps
}: GridListCellProps) {
  const cellProps: React.HTMLAttributes<HTMLDivElement> = {
    ...divProps,
    className,
    role: "gridcell",
  };

  if (asChild) {
    return <Slot {...cellProps}>{children}</Slot>;
  }

  return <div {...cellProps}>{children}</div>;
}

export function GridCurrentFocusInput({ name }: { name: string }) {
  const { lastFocusedRowId } = useGridListState();

  if (!lastFocusedRowId) {
    return null;
  }

  return <input type="hidden" name={name} value={lastFocusedRowId} />;
}

export function GridCurrentSelectedRowsInput({ name }: { name: string }) {
  const { selectedRows } = useSelectionState();

  return (
    <select name={name} hidden>
      {Array.from(selectedRows).map((rowId) => (
        <option key={rowId} value={rowId}>
          {rowId}
        </option>
      ))}
    </select>
  );
}
