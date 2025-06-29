"use client";

import { createReducerContext } from "@/utils/reducer-context";
import { createPortal } from "react-dom";

export function createPortalContext(displayName = "PortalContext") {
  const [ContextProvider, useState, useDispatch] = createReducerContext(
    (state: State, action: Action): State => {
      switch (action.type) {
        case "set-container":
          return { ...state, container: action.payload };
        case "clear-container":
          return { ...state, container: null };
      }

      return state;
    },
    {
      container: null,
    },
    displayName,
  );

  function Provider({ children }: { children: React.ReactNode }) {
    return <ContextProvider>{children}</ContextProvider>;
  }

  Provider.displayName = `${displayName}.Provider`;

  function Slot(
    divProps: Omit<React.HTMLAttributes<HTMLDivElement>, "ref" | "children">,
  ) {
    const dispatch = useDispatch();

    return (
      <div
        {...divProps}
        ref={(el) => {
          if (el) {
            dispatch({ type: "set-container", payload: el });
          } else {
            // support older version of react
            dispatch({ type: "clear-container" });
          }

          return () => {
            dispatch({ type: "clear-container" });
          };
        }}
      />
    );
  }

  Slot.displayName = `${displayName}.Slot`;

  function Content({ children }: { children: React.ReactNode }) {
    const state = useState();
    const container = state.container;

    if (!container) return null;

    return createPortal(children, container);
  }

  Content.displayName = `${displayName}.Content`;

  return [Provider, Slot, Content] as const;
}

interface State {
  container: HTMLElement | null;
}

type Action =
  | {
      type: "set-container";
      payload: HTMLElement;
    }
  | {
      type: "clear-container";
    };
