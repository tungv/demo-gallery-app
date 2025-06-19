"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createReducerContext } from "@/utils/reducer-context";
import type { DialogContentProps } from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { useEffect, type HTMLAttributes } from "react";

type DialogType =
  | "delete-person"
  | "edit-person"
  | "delete-multiple-people"
  | "add-person";

interface PeopleListDialogState {
  openDialog: DialogType | null;
}

type PeopleListDialogAction =
  | {
      type: "open";
      payload: {
        dialog: DialogType;
      };
    }
  | {
      type: "close";
    };

const [Provider, usePeopleListDialogState, usePeopleListDialogDispatch] =
  createReducerContext(
    (state: PeopleListDialogState, action: PeopleListDialogAction) => {
      switch (action.type) {
        case "open":
          return { ...state, openDialog: action.payload.dialog };
        case "close":
          return { ...state, openDialog: null };
      }
    },
    {
      openDialog: null,
    },
    "PeopleListDialogProvider",
  );

export function PeopleListDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider>{children}</Provider>;
}

export function PeopleListDialog({ children }: { children: React.ReactNode }) {
  const state = usePeopleListDialogState();
  const dispatch = usePeopleListDialogDispatch();

  const isOpen = state.openDialog !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(becomeOpen) => {
        if (!becomeOpen) {
          dispatch({ type: "close" });
        }
      }}
    >
      {children}
    </Dialog>
  );
}

export function PeopleListDialogContent({
  when,
  children,
  ...contentProps
}: {
  when: DialogType;
  children: React.ReactNode;
} & DialogContentProps) {
  const state = usePeopleListDialogState();

  if (state.openDialog !== when) return null;

  return <DialogContent {...contentProps}>{children}</DialogContent>;
}

export function PeopleListDialogTrigger({
  dialog,
  children,
  asChild,
  onClick,
  ...btnProps
}: {
  dialog: DialogType;
  children: React.ReactNode;
  asChild?: boolean;
} & HTMLAttributes<HTMLButtonElement>) {
  const dispatch = usePeopleListDialogDispatch();

  const triggerProps = {
    ...btnProps,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      dispatch({ type: "open", payload: { dialog } });
      onClick?.(e);
    },
    type: "button" as const,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return <button {...triggerProps}>{children}</button>;
}

export function AutoCloseDialog({
  delayMs,
  children = null,
}: {
  delayMs?: number;
  children?: React.ReactNode;
}) {
  const dispatch = usePeopleListDialogDispatch();

  useEffect(() => {
    if (!delayMs) {
      dispatch({ type: "close" });
      return;
    }

    const timeout = setTimeout(() => {
      dispatch({ type: "close" });
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, dispatch]);

  return children;
}
