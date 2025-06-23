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
  use,
} from "react";
import type { FormEventHandler, HTMLAttributes } from "react";
import useEffectEvent from "../use-effect-event";
import { Checkbox } from "../checkbox";
import type {
  GridListContentProps,
  SelectionAction,
  SelectionState,
} from "./types";
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
  GridContentContext,
} from "./state";
import {
  useRegisterRow,
  useFocusRow,
  useFocusFirstRow,
  useHandleSpacebar,
  useGridListTabIndexManager,
  useGridListKeyboardHandlers,
  useRowData,
} from "./hooks";

export function GridListContainer({
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
}: GridListRootProps) {
  const isControlled = typeof value !== "undefined";

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

  const containerInner = (
    <div className={cn("relative", className)} {...divProps}>
      {children}
      <HiddenSelectionInput onInvalid={onInvalid} />
    </div>
  );

  const optionalControlled = isControlled ? (
    <ControlledValueContext value={reactiveValue}>
      {containerInner}
    </ControlledValueContext>
  ) : (
    containerInner
  );

  return (
    <GridDataProvider>
      <SelectionStateProvider
        selectionMode={selectionMode}
        selectedRows={initialSelectedRows}
        middleware={selectionMiddleware}
      >
        <GridListStateProvider
          _default={false}
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

export function GridListContent({
  children,
  gridClassName,
  scrollableContainerClassName,

  scrollable = false,
  ...divProps
}: GridListContentProps) {
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <GridContentContext.Provider value={{ startRef, endRef, containerRef }}>
      <div
        className={cn(
          "max-w-full overflow-x-auto",
          scrollableContainerClassName,
        )}
      >
        <GridListContentInner {...divProps} className={cn(gridClassName)}>
          <span data-focus-scope-start hidden tabIndex={-1} ref={startRef} />
          {children}
          <span data-focus-scope-end hidden tabIndex={-1} ref={endRef} />
        </GridListContentInner>
      </div>
    </GridContentContext.Provider>
  );
}

function GridListContentInner({
  children,
  className,

  ...divProps
}: {
  children: React.ReactNode;

  startRef?: React.RefObject<HTMLSpanElement | null>;
  endRef?: React.RefObject<HTMLSpanElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { isFocusWithinContainer } = useGridListState();
  const dispatch = useGridListDispatch();
  const { lastFocusedRowId } = useGridListState();

  const focusRow = useFocusRow();
  // Helper function to focus the first row
  const focusFirstRow = useFocusFirstRow();

  const containerRef = useContext(GridContentContext).containerRef;

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

  const handleKeyDown = useGridListKeyboardHandlers();

  const { labelIds, captionIds } = useGridLabelingState();

  // Combine manual ARIA props with registered label/caption IDs
  const combinedLabelledBy =
    [
      ...(divProps["aria-labelledby"]
        ? divProps["aria-labelledby"].split(/\s+/)
        : []),
      ...labelIds,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const combinedDescribedBy =
    [
      ...(divProps["aria-describedby"]
        ? divProps["aria-describedby"].split(/\s+/)
        : []),
      ...captionIds,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const innerProps: HTMLAttributes<HTMLDivElement> & {
    "data-focused"?: string;
  } = {
    ...divProps,
    className: cn("grid", className),
    role: "grid",
    tabIndex: -1,
    "data-focused": isFocusWithinContainer ? "true" : undefined,
    "aria-labelledby": combinedLabelledBy,
    "aria-describedby": combinedDescribedBy,
    onKeyDown: handleKeyDown,

    onFocusCapture: (event) => {
      const origin = event.relatedTarget as Element;

      const isEnteringGrid =
        !origin || !containerRef?.current?.contains(origin);

      if (isEnteringGrid) {
        // console.log("entering grid");
        event.stopPropagation();

        // find the row to focus
        // 1. if the lastFocusedRowId is not null, focus it
        // 2. if the first row is not focused, focus it
        if (lastFocusedRowId) {
          // console.log("redirect focus to", lastFocusedRowId);

          if (focusRow(lastFocusedRowId)) {
            return;
          }
        }
        // console.log("redirect focus to first row");
        focusFirstRow();
      }
    },
    onBlurCapture: (event) => {
      const destination = event.relatedTarget as Element;

      const isLeavingGrid =
        !destination || !containerRef?.current?.contains(destination);

      if (isLeavingGrid) {
        // console.log("leaving grid from %s", lastFocusedRowId);
      }
    },
  };

  useGridListTabIndexManager(children);

  return (
    <div {...innerProps} ref={containerRef}>
      {children}
    </div>
  );
}

function HiddenSelectionInput({
  onInvalid,
}: {
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

export const GridHeader = memo(function GridHeader({
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
    className: cn("grid col-span-full grid-cols-subgrid", className),
    role: "rowgroup",
  };

  // only wrap the context if we are in multiple selection mode
  if (selectionMode !== "multiple") {
    return <header {...headerProps}>{children}</header>;
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
      <header {...headerProps}>{children}</header>
    </SelectionIndicatorContext>
  );
});

export function GridBody({
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

export function GridFooter({
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

// Dev-mode warning component
function DevModeWarning({
  componentName,
  issue,
}: {
  componentName: string;
  issue: string;
}) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        border: "2px solid #ef4444",
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        padding: "8px",
        margin: "4px 0",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
      }}
    >
      <strong>⚠️ {componentName} Usage Warning:</strong> {issue}
    </div>
  );
}

export function GridListTitle({
  children,
  className,
  asChild,
  ...headingProps
}: GridListTitleProps) {
  const dispatch = useGridLabelingDispatch();

  const isInGridListContainer = useGridListState()._default !== true;
  const isInGridListContent = useContext(GridContentContext)._default !== true;

  const titleId = useId();

  // Register this title ID when component mounts
  useEffect(() => {
    dispatch({ type: "addLabel", id: titleId });
    return () => {
      dispatch({ type: "removeLabel", id: titleId });
    };
  }, [dispatch, titleId]);

  const titleProps = {
    ...headingProps,
    id: titleId,
    className: cn("text-lg font-semibold", className),
  };

  const titleElement = asChild ? (
    <Slot {...titleProps}>{children}</Slot>
  ) : (
    <h2 {...titleProps}>{children}</h2>
  );

  return (
    <>
      {!isInGridListContainer && (
        <DevModeWarning
          componentName="GridListTitle"
          issue="GridListTitle must be inside a GridListContainer to work properly with accessibility features."
        />
      )}
      {isInGridListContent && (
        <DevModeWarning
          componentName="GridListTitle"
          issue="GridListTitle should not be inside GridListContent. Place it outside the GridListContent but inside the GridListContainer."
        />
      )}
      {titleElement}
    </>
  );
}

export function GridListCaption({
  children,
  className,
  asChild,
  ...divProps
}: GridListCaptionProps) {
  const dispatch = useGridLabelingDispatch();

  const isInGridListContainer = useGridListState()._default !== true;
  const isInGridListContent = useContext(GridContentContext)._default !== true;

  const captionId = useId();

  // Register this caption ID when component mounts
  useEffect(() => {
    dispatch({ type: "addCaption", id: captionId });
    return () => {
      dispatch({ type: "removeCaption", id: captionId });
    };
  }, [dispatch, captionId]);

  const captionProps = {
    ...divProps,
    id: captionId,
    className: cn("text-sm text-muted-foreground", className),
  };

  const captionElement = asChild ? (
    <Slot {...captionProps}>{children}</Slot>
  ) : (
    <p {...captionProps}>{children}</p>
  );

  return (
    <>
      {!isInGridListContainer && (
        <DevModeWarning
          componentName="GridListCaption"
          issue="GridListCaption must be inside a GridListContainer to work properly with accessibility features."
        />
      )}
      {isInGridListContent && (
        <DevModeWarning
          componentName="GridListCaption"
          issue="GridListCaption should not be inside GridListContent. Place it outside the GridListContent but inside the GridListContainer."
        />
      )}
      {captionElement}
    </>
  );
}

export const GridListRow = function GridListRow({
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

  // Only provide SelectionIndicatorContext for rows inside GridListBody
  if (selectionMode === "none" || !isInBody) {
    return contextWrappedElem;
  }

  return (
    <SelectionIndicatorContext value={selectionCtxValue}>
      {contextWrappedElem}
    </SelectionIndicatorContext>
  );
};

function RowInner({
  children,
  asChild,
  ...divProps
}: {
  children: React.ReactNode;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dispatch = useGridListDispatch();
  const { rowId } = use(RowContext);
  useHandleSpacebar(rowRef);

  const rowProps: React.HTMLAttributes<HTMLDivElement> = {
    ...divProps,
    onFocusCapture: (event) => {
      const origin = event.relatedTarget as Element;

      const isEnteringRow = !origin || !rowRef.current?.contains(origin);

      if (isEnteringRow) {
        console.log("entering row %s", rowId);
        // set lastFocusedRowId to the rowId
        dispatch({ type: "setLastFocusedRow", rowId: rowId });
      }
    },
    onBlurCapture: (event) => {
      const destination = event.relatedTarget as Element;

      const isLeavingRow =
        !destination || !rowRef.current?.contains(destination);

      if (isLeavingRow) {
        console.log("leaving row %s", rowId);
      }
    },
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
  selectLabel = "Select",
  deselectLabel = "Deselect",
  ...buttonProps
}: {
  children?: React.ReactNode;
  selectLabel?: string;
  deselectLabel?: string;
  onCheckedChange?: (checked: boolean) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const rowContext = useContext(RowContext);

  if (!rowContext) {
    throw new Error(
      "GridListItemIndicatorRoot must be used within a GridListRow",
    );
  }
  const { selected, onCheckedChange } = useContext(SelectionIndicatorContext);

  const labelText =
    selected === "indeterminate" || selected === true
      ? deselectLabel
      : selectLabel;

  const btnProps = {
    ...buttonProps,
    "aria-label": labelText,
  };

  const srOnly = <span className="sr-only">{labelText}</span>;

  if (!children) {
    // render default checkbox
    return (
      <Checkbox
        checked={selected}
        onCheckedChange={onCheckedChange}
        {...btnProps}
      />
    );
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
      {...btnProps}
    >
      {children}
      {srOnly}
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

export function GridListRowHeader({
  children,
  className,
  rowSpan,
  scope = "row",
  asChild,
  ...divProps
}: GridListRowHeaderProps) {
  const rowContext = useContext(RowContext);
  const selectionDispatch = useSelectionDispatch();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();
  const { rows } = useGridDataState();

  const headerProps: React.HTMLAttributes<HTMLDivElement> & {
    "aria-rowspan"?: number;
    scope?: "row" | "rowgroup";
  } = {
    ...divProps,
    role: "rowheader",
    scope,
    className: cn("font-medium text-left", className),
    onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => {
      try {
        // Only handle double-click if we have a row context and selection is enabled
        if (!rowContext || selectionMode === "none") return;

        const { rowId } = rowContext;

        // Find the row data to check if it's disabled or readOnly
        const rowData = rows.find((row) => row.rowId === rowId);
        if (rowData?.disabled || rowData?.readOnly) return;

        // Toggle selection state
        const isCurrentlySelected = selectedRows.has(rowId);
        if (isCurrentlySelected) {
          selectionDispatch({ type: "deselectRow", rowId });
        } else {
          selectionDispatch({ type: "selectRow", rowId });
        }
      } finally {
        // Call the original onDoubleClick if provided
        divProps.onDoubleClick?.(event);
      }
    },
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

export function GridCurrentFocusFormField({ name }: { name: string }) {
  const { lastFocusedRowId } = useGridListState();

  if (!lastFocusedRowId) {
    return null;
  }

  return <input type="hidden" name={name} value={lastFocusedRowId} />;
}

export function GridCurrentSelectedRowsFormField({ name }: { name: string }) {
  const { selectedRows } = useSelectionState();

  return (
    <select
      name={name}
      hidden
      multiple
      value={Array.from(selectedRows)}
      onChange={() => {}}
    >
      {Array.from(selectedRows).map((rowId) => (
        <option key={rowId} value={rowId}>
          {rowId}
        </option>
      ))}
    </select>
  );
}

export function CurrentRowIdFormField({ name }: { name: string }) {
  const rowContext = useContext(RowContext);

  if (!rowContext) {
    throw new Error("CurrentRowIdFormField must be used within a GridListRow");
  }

  const { rowId } = rowContext;

  return <input type="hidden" name={name} value={rowId} />;
}
