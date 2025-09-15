"use client";

import type * as React from "react";
import { type PropsWithChildren, useCallback } from "react";
import { createReducerContext } from "@/utils/reducer-context";
import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
} from "@/components/ui/dialog";
import { Slot } from "@radix-ui/react-slot";
import useEffectEvent from "../ui/use-effect-event";

type LinkedDialogState = {
  openDialog: string | null;
  focusReturnElement: Element | null;
};

type LinkedDialogAction =
  | { type: "open"; dialog: string; returnElement: Element | null }
  | { type: "close" };

function linkedDialogReducer(
  state: LinkedDialogState,
  action: LinkedDialogAction,
): LinkedDialogState {
  switch (action.type) {
    case "open":
      return {
        openDialog: action.dialog,
        focusReturnElement: action.returnElement,
      };
    case "close":
      return {
        openDialog: null,
        focusReturnElement: null,
      };
    default:
      return state;
  }
}

const initialState: LinkedDialogState = {
  openDialog: null,
  focusReturnElement: null,
};

export interface LinkedDialogTriggerProps<T extends string>
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The unique identifier for the dialog to open */
  dialog: T;
  /**
   * When true, the Trigger will not render its own button element.
   * Instead, it will pass the props to its child element using Slot.
   */
  asChild?: boolean;
}

export interface LinkedDialogProps extends PropsWithChildren {
  /** Callback fired when the dialog open state changes */
  onOpenChange?: (open: boolean) => void;
}

export interface LinkedDialogContentProps<T extends string>
  extends React.ComponentPropsWithoutRef<typeof DialogContentPrimitive> {
  /** The unique identifier that matches the Trigger's dialog prop */
  dialog: T;
  children?: React.ReactNode;
}

/**
 * Creates a linked dialog system where remote triggers can open dialogs by name.
 *
 * @param dialogNames - Array of dialog names that can be used with this dialog system
 * @param debugName - Optional name for debugging and component display names
 * @returns An object containing Provider, Trigger, Dialog, and DialogContent components
 *
 * @example
 * ```tsx
 * // In a shared file (e.g., dialogs.tsx)
 * const { Provider, Trigger, Dialog, DialogContent } = createLinkedDialog(
 *   ["create-account", "create-client", "create-garment"],
 *   "AdminDialogs"
 * );
 *
 * // In your app - TypeScript will enforce only the defined dialog names
 * <Provider>
 *   <Trigger dialog="create-account">Create Account</Trigger>
 *
 *   <Dialog>
 *     <DialogContent dialog="create-account">
 *       <h2>Create New Account</h2>
 *       // ... form content
 *     </DialogContent>
 *   </Dialog>
 * </Provider>
 * ```
 */
export function createLinkedDialog<const T extends readonly string[]>(
  dialogNames: T,
  debugName?: string,
) {
  const [Provider, useStateContext, useDispatch] = createReducerContext(
    linkedDialogReducer,
    initialState,
  );

  type DialogName = T[number];

  // Runtime validation to ensure dialog names are valid
  const validateDialogName = (dialog: string): dialog is DialogName => {
    return dialogNames.includes(dialog as DialogName);
  };

  function Trigger({
    dialog,
    onClick,
    onKeyDown,
    asChild,
    children,
    ...props
  }: LinkedDialogTriggerProps<DialogName>) {
    const dispatch = useDispatch();
    const logWarning = useEffectEvent(() => {
      console.warn(
        `Invalid dialog name: "${dialog}". Valid names are: ${dialogNames.join(", ")}`,
      );
    });

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        // Call any existing onClick handler first
        onClick?.(event);

        if (event.defaultPrevented) return;

        // Capture the currently focused element for focus restoration
        const returnElement = document.activeElement;

        if (
          process.env.NODE_ENV !== "production" &&
          !validateDialogName(dialog)
        ) {
          logWarning();
        }

        setTimeout(() => {
          dispatch({
            type: "open",
            dialog,
            returnElement:
              returnElement instanceof Element ? returnElement : null,
          });
        }, 10);
      },
      [dialog, dispatch, onClick, logWarning],
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        // Call any existing onKeyDown handler first
        onKeyDown?.(event);

        if (event.defaultPrevented) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          // Capture the currently focused element for focus restoration
          const returnElement = document.activeElement;

          if (
            process.env.NODE_ENV !== "production" &&
            !validateDialogName(dialog)
          ) {
            logWarning();
          }

          dispatch({
            type: "open",
            dialog,
            returnElement:
              returnElement instanceof Element ? returnElement : null,
          });
        }
      },
      [dialog, dispatch, onKeyDown, logWarning],
    );

    if (asChild) {
      return (
        <Slot onClick={handleClick} onKeyDown={handleKeyDown} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button onClick={handleClick} onKeyDown={handleKeyDown} {...props}>
        {children}
      </button>
    );
  }

  function Dialog({ children, onOpenChange }: LinkedDialogProps) {
    const { openDialog, focusReturnElement } = useStateContext();
    const dispatch = useDispatch();
    const isOpen = openDialog !== null;

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) {
          dispatch({ type: "close" });

          // Attempt to restore focus after a small delay to ensure the dialog is fully closed
          setTimeout(() => {
            if (focusReturnElement?.isConnected) {
              (focusReturnElement as HTMLElement).focus?.();
            }
          }, 0);
        }
        onOpenChange?.(open);
      },
      [dispatch, focusReturnElement, onOpenChange],
    );

    return (
      <DialogPrimitive open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </DialogPrimitive>
    );
  }

  function DialogContent({
    dialog,
    children,
    ...props
  }: LinkedDialogContentProps<DialogName>) {
    const { openDialog } = useStateContext();

    // Runtime validation in development
    if (process.env.NODE_ENV !== "production" && !validateDialogName(dialog)) {
      console.warn(
        `Invalid dialog name: "${dialog}". Valid names are: ${dialogNames.join(", ")}`,
      );
    }

    // Only render if this dialog is the one that's open
    if (openDialog !== dialog) {
      return null;
    }

    return (
      <DialogContentPrimitive {...props}>{children}</DialogContentPrimitive>
    );
  }

  // Add display names for debugging
  Trigger.displayName = `${debugName || "LinkedDialog"}.Trigger`;
  Dialog.displayName = `${debugName || "LinkedDialog"}.Dialog`;
  DialogContent.displayName = `${debugName || "LinkedDialog"}.DialogContent`;

  return {
    Provider,
    Trigger,
    Dialog,
    DialogContent,
  };
}
