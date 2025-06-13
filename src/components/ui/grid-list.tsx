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

  return (
    <GridListProvider scope={scopeRef}>
      <div
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
