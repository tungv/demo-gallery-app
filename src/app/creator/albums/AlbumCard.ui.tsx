"use client";

import { createReducerContext } from "@/utils/reducer-context";
import type { ComponentProps, ReactNode } from "react";

interface AlbumCardState {
  isEditing: boolean;
}

type AlbumCardAction =
  | {
      type: "set_is_editing";
      payload: boolean;
    }
  | {
      type: "toggle_mode";
    };

const initialState: AlbumCardState = {
  isEditing: false,
};

const [Provider, useState, useDispatch] = createReducerContext(
  (state: AlbumCardState, action: AlbumCardAction) => {
    switch (action.type) {
      case "set_is_editing":
        return { ...state, isEditing: action.payload };

      case "toggle_mode":
        return { ...state, isEditing: !state.isEditing };

      default:
        return state;
    }
  },
  initialState,
);

export function AlbumCardRoot({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <div className="aspect-square size-72 rounded-lg bg-gradient-to-br from-purple-500/50 to-purple-600/50 grid grid-cols-1 grid-rows-[1fr_auto]  overflow-clip shadow-md">
        {children}
      </div>
    </Provider>
  );
}

export function ModeToggleButton({
  children,
  ...buttonProps
}: ComponentProps<"button">) {
  const dispatch = useDispatch();

  return (
    <button {...buttonProps} onClick={() => dispatch({ type: "toggle_mode" })}>
      {children}
    </button>
  );
}

// edit mode:
export function EditMode({ children, ...divProps }: ComponentProps<"div">) {
  const { isEditing } = useState();

  if (!isEditing) {
    return null;
  }

  return <div {...divProps}>{children}</div>;
}

// view mode:
export function ViewMode({ children, ...divProps }: ComponentProps<"div">) {
  const { isEditing } = useState();

  if (isEditing) {
    return null;
  }

  return <div {...divProps}>{children}</div>;
}
