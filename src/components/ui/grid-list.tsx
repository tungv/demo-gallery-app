"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

type GridState = {
  rows: Array<{ rowId: string }>;
  lastFocusedRowId: string | null;
  isFocusWithinContainer: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  startRef?: React.RefObject<HTMLSpanElement | null>;
  endRef?: React.RefObject<HTMLSpanElement | null>;
  cycleRowFocus: boolean;
  focusVisible: boolean;
};

type GridAction =
  | {
      type: "addRow";
      rowId: string;
    }
  | {
      type: "removeRow";
      rowId: string;
    }
  | {
      type: "setLastFocusedRow";
      rowId: string | null;
    }
  | {
      type: "setFocusWithinContainer";
      isFocusWithinContainer: boolean;
    }
  | {
      type: "setFocusVisible";
      focusVisible: boolean;
    };

const defaultState: GridState = {
  rows: [],
  lastFocusedRowId: null,
  isFocusWithinContainer: false,
  cycleRowFocus: false,
  focusVisible: false,
};

const [GridListProvider, useGridListState, useGridListDispatch] =
  createReducerContext((state: GridState, action: GridAction): GridState => {
    switch (action.type) {
      case "addRow":
        // check for existence before adding
        if (state.rows.some((row) => row.rowId === action.rowId)) {
          return state;
        }

        return { ...state, rows: [...state.rows, { rowId: action.rowId }] };
      case "removeRow": {
        const newRows = state.rows.filter((row) => row.rowId !== action.rowId);
        // Clear lastFocusedRowId if the removed row was the last focused one
        const newLastFocusedRowId =
          state.lastFocusedRowId === action.rowId
            ? null
            : state.lastFocusedRowId;
        return {
          ...state,
          rows: newRows,
          lastFocusedRowId: newLastFocusedRowId,
        };
      }
      case "setLastFocusedRow":
        return {
          ...state,
          lastFocusedRowId: action.rowId,
        };
      case "setFocusWithinContainer":
        return {
          ...state,
          isFocusWithinContainer: action.isFocusWithinContainer,
        };
      case "setFocusVisible":
        return {
          ...state,
          focusVisible: action.focusVisible,
        };
    }

    return state;
  }, defaultState);

function useRegisterRow(rowId: string) {
  const dispatch = useGridListDispatch();
  useEffect(() => {
    dispatch({ type: "addRow", rowId });

    return () => {
      dispatch({ type: "removeRow", rowId });
    };
  }, [dispatch, rowId]);
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

export function GridListRoot({
  children,
  className,
  gridColumnTemplate,
  cycleRowFocus = false,
  ...divProps
}: {
  children: React.ReactNode;
  gridColumnTemplate: string;
  cycleRowFocus?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to re-run this effect when the children change
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // set tabIndex=0 for the first row
    const firstRow = container.querySelector("[data-row-id]");
    if (firstRow) {
      firstRow.setAttribute("tabindex", "0");
    }

    return () => {
      const firstRow = container.querySelector("[data-row-id]");
      if (firstRow) {
        firstRow.setAttribute("tabindex", "-1");
      }
    };
  }, [children]);

  return (
    <GridListProvider
      startRef={startRef}
      endRef={endRef}
      containerRef={containerRef}
      cycleRowFocus={cycleRowFocus}
    >
      <div
        className="contents"
        tabIndex={-1}
        style={
          {
            "--grid-template-columns": gridColumnTemplate,
          } as React.CSSProperties
        }
        ref={containerRef}
      >
        <GridListInner className={className} {...divProps}>
          <span data-focus-scope-start hidden tabIndex={-1} ref={startRef} />
          {children}
          <span data-focus-scope-end hidden tabIndex={-1} ref={endRef} />
        </GridListInner>
      </div>
    </GridListProvider>
  );
}

function GridListInner({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { containerRef } = useGridListState();
  const dispatch = useGridListDispatch();
  const { lastFocusedRowId } = useGridListState();

  const focusRow = useFocusRow();
  // Helper function to focus the first row
  const focusFirstRow = useFocusFirstRow();

  useHandleTab();
  useHandleShiftTab();
  useHandleUpArrow();
  useHandleDownArrow();
  useHandleLeftArrow();
  useHandleRightArrow();

  // Focus visibility management - only track mouse interactions
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleMouseDown = () => {
      dispatch({
        type: "setFocusVisible",
        focusVisible: false,
      });
    };

    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
    };
  }, [dispatch, containerRef]);

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
          // Focus is not visible when set programmatically via mouse or initial focus
          if (focusRow(rowId, false)) {
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
        if (lastFocusedRowId && focusRow(lastFocusedRowId, false)) {
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
    className: cn(
      "grid grid-cols-(--grid-template-columns) focus-within:outline outline-primary",
      className,
    ),
    role: "grid",
    tabIndex: -1,
  };

  return <div {...innerProps}>{children}</div>;
}

export function GridListHeader({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...divProps}
    >
      {children}
    </div>
  );
}

export function GridListBody({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid col-span-full grid-cols-subgrid", className)}
      {...divProps}
    >
      {children}
    </div>
  );
}

export function GridListFooter({ children }: { children: React.ReactNode }) {
  return <div className="grid col-span-full grid-cols-subgrid">{children}</div>;
}

const RowContext = createContext<{
  rowId: string;
}>({
  rowId: "",
});

export function GridListRow({
  children,
  className,
  asChild,
  rowId,
  ...divProps
}: {
  children: React.ReactNode;
  asChild?: boolean;
  rowId: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const state = useGridListState();
  const isLastFocusedRow = state.lastFocusedRowId === rowId;

  // Only show as focused when the row element itself is the active element
  const isFocused =
    isLastFocusedRow &&
    state.isFocusWithinContainer &&
    document.activeElement?.getAttribute("data-row-id") === rowId;

  // Show focus-visible when focused and focus is visible (set via keyboard)
  const isFocusVisible = isFocused && state.focusVisible;

  const rowProps: React.HTMLAttributes<HTMLDivElement> & {
    "data-row-id": string;
    "data-focused"?: string;
    "data-focus-visible"?: string;
    "data-restore-focus"?: string;
  } = {
    ...divProps,
    role: "row",
    tabIndex: isLastFocusedRow ? 0 : -1,
    className: cn("grid col-span-full grid-cols-subgrid", className),
    "data-row-id": rowId,
    "data-focused": isFocused ? "true" : undefined,
    "data-focus-visible": isFocusVisible ? "true" : undefined,
    "data-restore-focus": isLastFocusedRow ? "true" : undefined,
  };

  useRegisterRow(rowId);

  if (asChild) {
    return (
      <RowContext value={{ rowId }}>
        <Slot {...rowProps}>{children}</Slot>
      </RowContext>
    );
  }

  return (
    <RowContext value={{ rowId }}>
      <div {...rowProps}>{children}</div>
    </RowContext>
  );
}

export function Debugger() {
  const { startRef, endRef, containerRef, ...state } = useGridListState();
  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
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
  const dispatch = useGridListDispatch();
  const focusRow = useFocusRow();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleUpArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      // Set focus visible when using keyboard navigation
      dispatch({
        type: "setFocusVisible",
        focusVisible: true,
      });

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      // find previous row using selector
      const allRows = container.querySelectorAll("[data-row-id]");

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
  }, [containerRef, focusRow, cycleRowFocus, dispatch]);
}

function useHandleDownArrow() {
  const { containerRef, cycleRowFocus } = useGridListState();
  const dispatch = useGridListDispatch();
  const focusRow = useFocusRow();

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const handleDownArrow = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown") {
        return;
      }

      event.preventDefault();

      // Set focus visible when using keyboard navigation
      dispatch({
        type: "setFocusVisible",
        focusVisible: true,
      });

      const activeElement = document.activeElement;
      if (!activeElement) return;

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const allRows = container.querySelectorAll("[data-row-id]");
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
  }, [containerRef, focusRow, cycleRowFocus, dispatch]);
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

  return (rowId: string, focusVisible = true): boolean => {
    const container = containerRef?.current;
    if (!container) return false;

    const rowElement = container.querySelector(`[data-row-id="${rowId}"]`);
    if (!rowElement) return false;

    if (safelyFocusElement(rowElement)) {
      dispatch({
        type: "setLastFocusedRow",
        rowId,
      });

      dispatch({
        type: "setFocusVisible",
        focusVisible,
      });

      return true;
    }

    return false;
  };
}

function useFocusFirstRow() {
  const { containerRef } = useGridListState();
  const focusRow = useFocusRow();

  return (focusVisible = false) => {
    const container = containerRef?.current;
    if (!container) return;

    const firstRow = container.querySelector("[data-row-id]");
    if (!firstRow) return;

    const id = firstRow.getAttribute("data-row-id");
    if (!id) return;

    focusRow(id, focusVisible);
  };
}
