"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import {
  memo,
  use,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEventHandler, HTMLAttributes, MouseEvent } from "react";
import { Checkbox } from "../checkbox";
import {
  useGridListKeyboardHandlers,
  useGridListTabIndexManager,
  useHandleSpacebar,
  useRegisterRow,
} from "./hooks";
import {
  ControlledValueContext,
  GridAccessibilityContext,
  GridContentContext,
  GridDataProvider,
  GridLabelingProvider,
  GridListBodyContext,
  GridListStateProvider,
  RowContext,
  SelectionIndicatorContext,
  SelectionStateProvider,
  selectionIdsInRange,
  selectionReducer,
  useGridDataState,
  useGridLabelingDispatch,
  useGridLabelingState,
  useGridListDispatch,
  useGridListState,
  useSelectedRows,
  useSelectionDispatch,
  useSelectionState,
} from "./state";
import type {
  GridListContentProps,
  SelectionAction,
  SelectionState,
} from "./types";
import type {
  GridListCaptionProps,
  GridListCellProps,
  GridListColumnHeaderProps,
  GridListRootProps,
  GridListRowHeaderProps,
  GridListRowProps,
  GridListTitleProps,
} from "./types";

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
  const label = divProps["aria-label"];
  const labelledBy = divProps["aria-labelledby"];
  const describedBy = divProps["aria-describedby"];
  const readOnly = divProps["aria-readonly"];
  const accessibility = useMemo(
    () => ({
      "aria-label": label,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
      "aria-readonly": readOnly,
    }),
    [label, labelledBy, describedBy, readOnly],
  );

  const onValueChangeEvent = useCallback(
    (rows: Set<string>) => {
      if (typeof onValueChange !== "function") return;
      const selectedArray = Array.from(rows);

      if (selectionMode === "multiple") {
        (onValueChange as (value: string[]) => void)(selectedArray);
      } else {
        (onValueChange as (value: string) => void)(selectedArray[0] ?? "");
      }
    },
    [onValueChange, selectionMode],
  );

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
              selectedRows: new Set(
                Array.isArray(value) ? value : value ? [value] : [],
              ),
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
          <GridLabelingProvider>
            <GridAccessibilityContext value={accessibility}>
              {optionalControlled}
            </GridAccessibilityContext>
          </GridLabelingProvider>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentContext = useMemo(() => ({ containerRef }), []);

  return (
    <GridContentContext.Provider value={contentContext}>
      <div
        className={cn(
          "max-w-full overflow-x-auto",
          scrollable && "max-h-96 overflow-y-auto",
          scrollableContainerClassName,
        )}
      >
        <GridListContentInner {...divProps} className={cn(gridClassName)}>
          {children}
        </GridListContentInner>
      </div>
    </GridContentContext.Provider>
  );
}

function GridListContentInner({
  children,
  className,
  ...divProps
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isFocusWithinContainer } = useGridListState();
  const dispatch = useGridListDispatch();
  const { lastFocusedRowId } = useGridListState();

  const { containerRef } = useContext(GridContentContext);

  // Effect to validate the currently focused row still exists
  useEffect(() => {
    if (!lastFocusedRowId || !containerRef?.current) return;

    const rowElement = containerRef.current.querySelector(
      `[data-row-id="${CSS.escape(lastFocusedRowId)}"]`,
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
  const accessibility = useContext(GridAccessibilityContext);
  const { selectionMode } = useSelectionState();

  // Combine manual ARIA props with registered label/caption IDs
  const combinedLabelledBy =
    [
      ...(divProps["aria-labelledby"]
        ? divProps["aria-labelledby"].split(/\s+/)
        : []),
      ...(accessibility["aria-labelledby"]?.split(/\s+/) ?? []),
      ...labelIds,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const combinedDescribedBy =
    [
      ...(divProps["aria-describedby"]
        ? divProps["aria-describedby"].split(/\s+/)
        : []),
      ...(accessibility["aria-describedby"]?.split(/\s+/) ?? []),
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
    "aria-label": divProps["aria-label"] ?? accessibility["aria-label"],
    "aria-readonly":
      divProps["aria-readonly"] ?? accessibility["aria-readonly"],
    "aria-multiselectable":
      selectionMode === "none" ? undefined : selectionMode === "multiple",
    tabIndex: -1,
    "data-focused": isFocusWithinContainer ? "true" : undefined,
    "aria-labelledby": combinedLabelledBy,
    "aria-describedby": combinedDescribedBy,
    onKeyDown: (event) => {
      divProps.onKeyDown?.(event);
      if (!event.defaultPrevented) handleKeyDown(event);
    },

    onFocusCapture: (event) => {
      dispatch({
        type: "setFocusWithinContainer",
        isFocusWithinContainer: true,
      });
      divProps.onFocusCapture?.(event);
    },
    onBlurCapture: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        dispatch({
          type: "setFocusWithinContainer",
          isFocusWithinContainer: false,
        });
      }
      divProps.onBlurCapture?.(event);
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
  selectionIds,
  ...divProps
}: GridListRowProps) {
  const state = useGridListState();
  const dispatch = useGridListDispatch();
  const selectionDispatch = useSelectionDispatch();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();
  const { rows: dataRows } = useGridDataState();
  const { containerRef } = useContext(GridContentContext);
  const isInBody = useContext(GridListBodyContext);

  const autoGeneratedRowId = useId();
  const actualRowId = rowId ?? autoGeneratedRowId;
  const isLastFocusedRow = state.lastFocusedRowId === actualRowId;

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
    "aria-readonly": readOnly || undefined,
    "aria-disabled": disabled || undefined,
    "aria-selected": selectionMode === "none" ? undefined : isRowSelected,
    "data-row-id": actualRowId,
    "data-restore-focus": isLastFocusedRow ? "true" : undefined,
    "data-selected": isRowSelected ? "true" : undefined,
    "data-readonly": readOnly ? "true" : undefined,
    "data-disabled": disabled ? "true" : undefined,
  };

  useRegisterRow(actualRowId, readOnly, disabled, rowData, selectionIds);

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
    const representedIds = selectionIds ?? [actualRowId];
    const selectedCount = representedIds.filter((representedId) =>
      selectedRows.has(representedId),
    ).length;
    const selected =
      selectedCount === 0
        ? false
        : selectedCount === representedIds.length
          ? true
          : "indeterminate";

    return {
      selected: selected as boolean | "indeterminate",
      onCheckedChange: (
        checked: boolean,
        event?: MouseEvent<HTMLButtonElement>,
      ) => {
        if (disabled || (readOnly && selectionIds === undefined)) return;

        const anchor = state.lastSelectionAnchorId;
        if (event?.shiftKey && selectionMode === "multiple" && anchor) {
          const orderedRowIds = Array.from(
            containerRef?.current?.querySelectorAll<HTMLElement>(
              "[data-row-id]",
            ) ?? [],
            (row) => row.dataset.rowId ?? "",
          ).filter(Boolean);
          const range = selectionIdsInRange(
            dataRows,
            anchor,
            actualRowId,
            orderedRowIds,
          );
          if (range.length) {
            selectionDispatch({
              type: "setSelectedRows",
              selectedRows: [...selectedRows, ...range],
            });
            return;
          }
        }

        if (selectionMode === "single") {
          selectionDispatch({
            type: "setSelectedRows",
            selectedRows: checked ? representedIds.slice(0, 1) : [],
          });
        } else {
          const next = new Set(selectedRows);
          for (const representedId of representedIds) {
            if (checked) next.add(representedId);
            else next.delete(representedId);
          }
          selectionDispatch({
            type: "setSelectedRows",
            selectedRows: [...next],
          });
        }
        dispatch({ type: "setLastSelectionAnchor", rowId: actualRowId });
      },
    };
  }, [
    selectionDispatch,
    dispatch,
    actualRowId,
    disabled,
    readOnly,
    selectionIds,
    state.lastSelectionAnchorId,
    selectionMode,
    dataRows,
    selectedRows,
    containerRef,
  ]);

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
      divProps.onFocusCapture?.(event);

      if (isEnteringRow) {
        dispatch({ type: "setLastFocusedRow", rowId: rowId });
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
  onCheckedChange: onChange,
  onClick,
  ...buttonProps
}: {
  children?: React.ReactNode;
  selectLabel?: string;
  deselectLabel?: string;
  onCheckedChange?: (checked: boolean) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { selected, onCheckedChange } = useContext(SelectionIndicatorContext);

  const labelText =
    selected === "indeterminate" || selected === true
      ? deselectLabel
      : selectLabel;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const checked = selected === "indeterminate" ? false : !selected;
    onCheckedChange(checked, event);
    onChange?.(checked);
    onClick?.(event);
  };

  const srOnly = <span className="sr-only">{labelText}</span>;

  if (!children) {
    // render default checkbox
    return (
      <Checkbox
        checked={selected}
        className={className}
        onClick={handleClick}
        aria-label={buttonProps["aria-label"] ?? labelText}
        {...buttonProps}
      />
    );
  }

  return (
    <button
      {...buttonProps}
      type="button"
      // biome-ignore lint/a11y/useSemanticElements: a button is required to compose custom selected, unselected, and mixed-state content.
      role="checkbox"
      aria-checked={selected === "indeterminate" ? "mixed" : selected}
      aria-label={buttonProps["aria-label"] ?? labelText}
      className={cn(
        "cursor-pointer border-none bg-transparent p-0 m-0",
        className,
      )}
      onClick={handleClick}
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
