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
    };

const defaultState: GridState = {
  rows: [],
  lastFocusedRowId: null,
  isFocusWithinContainer: false,
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
  ...divProps
}: {
  children: React.ReactNode;
  gridColumnTemplate: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const startRef = useRef<HTMLSpanElement>(null);
  const endRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <GridListProvider
      startRef={startRef}
      endRef={endRef}
      containerRef={containerRef}
    >
      <div
        ref={containerRef}
        className="contents"
        style={
          {
            "--grid-template-columns": gridColumnTemplate,
          } as React.CSSProperties
        }
      >
        <span data-focus-scope-start hidden ref={startRef} />
        <GridListInner className={className} {...divProps}>
          {children}
        </GridListInner>
        <span data-focus-scope-end hidden ref={endRef} />
      </div>
    </GridListProvider>
  );
}

function GridListInner({
  children,
  className,
  ...divProps
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useGridListDispatch();
  const { rows, isFocusWithinContainer, lastFocusedRowId } = useGridListState();

  const focusRow = useFocusRow();
  // Helper function to focus the first row
  const focusFirstRow = useFocusFirstRow();

  useHandleTab();
  useHandleShiftTab();
  useHandleUpArrow();
  useHandleDownArrow();
  useHandleLeftArrow();
  useHandleRightArrow();

  // Focus management for entering the grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      if (!target || !container.contains(target)) return;

      // Set focus within container to true
      if (!isFocusWithinContainer) {
        dispatch({
          type: "setFocusWithinContainer",
          isFocusWithinContainer: true,
        });
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
      }

      // Track which row is currently focused
      const rowElement = target.closest("[data-row-id]");
      if (rowElement) {
        const rowId = rowElement.getAttribute("data-row-id");
        if (rowId && rowId !== lastFocusedRowId) {
          focusRow(rowId);
        }
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
  }, [
    lastFocusedRowId,
    isFocusWithinContainer,
    focusRow,
    focusFirstRow,
    dispatch,
  ]);

  return (
    <div
      ref={containerRef}
      {...divProps}
      className={cn(
        "grid grid-cols-(--grid-template-columns) focus-within:outline outline-primary",
        className,
      )}
    >
      <div className="contents">{children}</div>
    </div>
  );
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
  const isFocused =
    state.lastFocusedRowId === rowId && state.isFocusWithinContainer;

  const rowProps: React.HTMLAttributes<HTMLDivElement> & {
    "data-row-id": string;
    "data-focused"?: string;
  } = {
    ...divProps,
    role: "listitem",
    tabIndex: 0,
    className: cn("grid col-span-full grid-cols-subgrid", className),
    "data-row-id": rowId,
    "data-focused": isFocused ? "true" : undefined,
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

      if (sentinelEndIndex === -1) {
        console.error("sentinel end is not in the list of tabbable elements");
        // this can't happen
        return;
      }

      // find the first tabbable element after the sentinel end
      const firstTabbableElementAfterSentinelEnd =
        allTabbableElements[sentinelEndIndex + 1];

      // if the grid is the last tabbable element, focus the first tabbable element
      if (!firstTabbableElementAfterSentinelEnd) {
        allTabbableElements[0]?.focus();
        return;
      }

      firstTabbableElementAfterSentinelEnd.focus();
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

      console.log("handleShiftTab", event);

      event.preventDefault();
      const allTabbableElements = getAllTabbableElements();

      const sentinelStartIndex = allTabbableElements.indexOf(sentinelStart);

      if (sentinelStartIndex === -1) {
        console.error("sentinel start is not in the list of tabbable elements");
        // this can't happen
        return;
      }

      const lastTabbableElementBeforeSentinelStart =
        allTabbableElements[sentinelStartIndex - 1];

      if (!lastTabbableElementBeforeSentinelStart) {
        allTabbableElements[allTabbableElements.length - 1]?.focus();
        return;
      }

      lastTabbableElementBeforeSentinelStart.focus();
    };

    container.addEventListener("keydown", handleShiftTab);

    return () => {
      container.removeEventListener("keydown", handleShiftTab);
    };
  }, [startRef, containerRef]);
}

function useHandleUpArrow() {
  const { containerRef } = useGridListState();
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

      // find previous row using selector
      const allRows = container.querySelectorAll("[data-row-id]");

      const currentRowIndex = Array.from(allRows).findIndex(
        (row) => row === currentRowElement,
      );
      if (currentRowIndex === -1) return;

      const targetRowIndex = currentRowIndex - 1;
      if (targetRowIndex < 0) return;

      const targetRow = allRows[targetRowIndex];

      const id = targetRow.getAttribute("data-row-id");
      if (!id) return;

      focusRow(id);
    };

    container.addEventListener("keydown", handleUpArrow);

    return () => {
      container.removeEventListener("keydown", handleUpArrow);
    };
  }, [containerRef, focusRow]);
}

function useHandleDownArrow() {
  const { containerRef } = useGridListState();
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

      console.log("activeElement", activeElement);

      const currentRowElement = activeElement.closest("[data-row-id]");
      if (!currentRowElement) return;

      const allRows = container.querySelectorAll("[data-row-id]");
      const currentRowIndex = Array.from(allRows).findIndex(
        (row) => row === currentRowElement,
      );
      if (currentRowIndex === -1) return;

      console.log("currentRowIndex", currentRowIndex);

      const targetRowIndex = currentRowIndex + 1;
      if (targetRowIndex >= allRows.length) return;

      const targetRow = allRows[targetRowIndex];
      const id = targetRow.getAttribute("data-row-id");
      if (!id) return;

      focusRow(id);
    };

    container.addEventListener("keydown", handleDownArrow);

    return () => {
      container.removeEventListener("keydown", handleDownArrow);
    };
  }, [containerRef, focusRow]);
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

      console.log("allTabbableElements", allTabbableElements);

      const currentTabbableIndex = allTabbableElements.indexOf(
        activeElement as HTMLElement,
      );
      if (currentTabbableIndex === -1) {
        // focus the first tabbable element
        allTabbableElements[0]?.focus();
        return;
      }

      const targetTabbableIndex = currentTabbableIndex - 1;
      if (targetTabbableIndex < 0) return;

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

      const currentTabbableIndex = allTabbableElements.indexOf(
        activeElement as HTMLElement,
      );
      if (currentTabbableIndex === -1) {
        // focus the last tabbable element
        allTabbableElements[allTabbableElements.length - 1]?.focus();
        return;
      }

      const targetTabbableIndex = currentTabbableIndex + 1;
      if (targetTabbableIndex >= allTabbableElements.length) return;

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

function safelyFocusElement(element: Element): void {
  if (element instanceof HTMLElement && element.focus) {
    element.focus();
    return;
  }
}

function useFocusRow() {
  const { containerRef } = useGridListState();
  const dispatch = useGridListDispatch();

  return (rowId: string) => {
    const container = containerRef?.current;
    if (!container) return;

    const rowElement = container.querySelector(`[data-row-id="${rowId}"]`);
    if (!rowElement) return;

    safelyFocusElement(rowElement);
    dispatch({
      type: "setLastFocusedRow",
      rowId,
    });
  };
}

function useFocusFirstRow() {
  const { containerRef } = useGridListState();
  const focusRow = useFocusRow();

  return () => {
    const container = containerRef?.current;
    if (!container) return;

    const firstRow = container.querySelector("[data-row-id]");
    if (!firstRow) return;

    const id = firstRow.getAttribute("data-row-id");
    if (!id) return;

    focusRow(id);
  };
}
