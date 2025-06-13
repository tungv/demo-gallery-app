"use client";

import { cn } from "@/lib/utils";
import { createReducerContext } from "@/utils/reducer-context";
import { Slot } from "@radix-ui/react-slot";
import { createContext, useEffect, useLayoutEffect, useRef } from "react";

type GridState = {
  rows: Array<{ rowId: string }>;
  scope: React.RefObject<Element[]> | null;
};

type GridAction =
  | {
      type: "addRow";
      rowId: string;
    }
  | {
      type: "removeRow";
      rowId: string;
    };

const defaultState: GridState = {
  rows: [],
  scope: null,
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
      case "removeRow":
        return {
          ...state,
          rows: state.rows.filter((row) => row.rowId !== action.rowId),
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
function getTabbableElements(container: Element): Element[] {
  const tabbableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    "details",
    "summary",
  ].join(",");

  return Array.from(container.querySelectorAll(tabbableSelectors)).filter(
    (el) => {
      const tabIndex = el.getAttribute("tabindex");
      return tabIndex !== "-1" && (el as HTMLElement).offsetParent !== null;
    },
  );
}

// Helper function to get all tabbable elements on the page
function getAllTabbableElements(): Element[] {
  return getTabbableElements(document.body);
}

const RESTORE_FOCUS_EVENT = "restore-focus";

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
  const scopeRef = useRef<Element[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tracking children for refreshing scope
  useLayoutEffect(() => {
    // Find all rendered nodes between the sentinels and add them to the scope.
    let node = startRef.current?.nextSibling;
    if (!node) {
      return;
    }

    const nodes: Element[] = [];
    const stopPropagation = (e: Event) => e.stopPropagation();
    while (node && node !== endRef.current) {
      nodes.push(node as Element);
      // Stop custom restore focus event from propagating to parent focus scopes.
      node.addEventListener(RESTORE_FOCUS_EVENT, stopPropagation);
      node = node.nextSibling as Element;
    }

    scopeRef.current = nodes;

    return () => {
      for (const node of nodes) {
        node.removeEventListener(RESTORE_FOCUS_EVENT, stopPropagation);
      }
    };
  }, [children]);

  // Focus trapping logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const activeElement = document.activeElement;
      if (!activeElement || !container.contains(activeElement)) return;

      if (event.shiftKey) {
        // Shift+Tab: move to previous tabbable element before the grid
        event.preventDefault();
        const allTabbableElements = getAllTabbableElements();
        const containerTabbableElements = getTabbableElements(container);

        // Find the first tabbable element in the container
        const firstContainerElement = containerTabbableElements[0];
        if (!firstContainerElement) return;

        // Find the index of the first container element in the page's tabbable elements
        const firstContainerIndex = allTabbableElements.indexOf(
          firstContainerElement,
        );

        // Move to the previous element before the container
        const previousIndex = firstContainerIndex - 1;
        if (previousIndex >= 0) {
          (allTabbableElements[previousIndex] as HTMLElement).focus();
        } else {
          // If at the beginning of the page, wrap to the last tabbable element
          (
            allTabbableElements[allTabbableElements.length - 1] as HTMLElement
          )?.focus();
        }
      } else {
        // Tab: move to next tabbable element on the page (outside the grid)
        event.preventDefault();
        const allTabbableElements = getAllTabbableElements();
        const containerTabbableElements = getTabbableElements(container);

        // Find the last tabbable element in the container
        const lastContainerElement =
          containerTabbableElements[containerTabbableElements.length - 1];
        if (!lastContainerElement) return;

        // Find the index of the last container element in the page's tabbable elements
        const lastContainerIndex =
          allTabbableElements.indexOf(lastContainerElement);

        // Move to the next element after the container
        const nextIndex = lastContainerIndex + 1;
        if (nextIndex < allTabbableElements.length) {
          (allTabbableElements[nextIndex] as HTMLElement).focus();
        } else {
          // If at the end of the page, wrap to the first tabbable element
          (allTabbableElements[0] as HTMLElement)?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <GridListProvider scope={scopeRef}>
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
  return (
    <div
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

export function GridListHeader({ children }: { children: React.ReactNode }) {
  return <div className="grid col-span-full grid-cols-subgrid">{children}</div>;
}

export function GridListBody({ children }: { children: React.ReactNode }) {
  return <div className="grid col-span-full grid-cols-subgrid">{children}</div>;
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
  asChild,
  rowId,
  ...divProps
}: {
  children: React.ReactNode;
  asChild?: boolean;
  rowId: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const rowProps = {
    ...divProps,
    role: "row",
    className: "grid col-span-full grid-cols-subgrid",
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

const getOwnerDocument = (el: Element | null | undefined): Document => {
  return el?.ownerDocument ?? document;
};
