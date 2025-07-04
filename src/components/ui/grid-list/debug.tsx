"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useGridListState, useSelectionState, useSelectedRows } from "./state";
import { GridListRow } from "./components";

export const Debugger = memo(function Debugger() {
  const { isFocusWithinContainer, lastFocusedRowId, cycleRowFocus } =
    useGridListState();
  const { selectionMode } = useSelectionState();
  const selectedRows = useSelectedRows();

  return (
    <GridListRow disabled>
      <dl
        className="text-sm bg-muted/50 p-1 rounded-md text-muted-foreground flex flex-row gap-8 col-span-full"
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: <explanation>
        // biome-ignore lint/a11y/useSemanticElements: <explanation>
        role="gridcell"
        tabIndex={-1}
        aria-readonly
      >
        <h3 className="text-sm font-bold tracking-tight">debugger</h3>
        <BooleanValue label="cycleRowFocus" value={cycleRowFocus} />
        <TextValue label="lastFocusedRowId" value={lastFocusedRowId} />
        <BooleanValue
          label="isFocusWithinContainer"
          value={isFocusWithinContainer}
        />
        <TextValue label="selectionMode" value={selectionMode} />
        <TextValue
          label="selectedRows"
          value={Array.from(selectedRows).join(", ") || "none"}
        />
      </dl>
    </GridListRow>
  );
});

function TextValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value == null) {
    return (
      <div className="flex flex-row gap-2 bg-muted items-center">
        <dt className="tracking-tighter font-semibold">{label}</dt>
        <dd className="italic font-mono">NULL</dd>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 bg-muted items-center">
      <dt className="tracking-tighter font-semibold">{label}</dt>
      <dd className="font-mono">{JSON.stringify(value)}</dd>
    </div>
  );
}

function BooleanValue({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex flex-row gap-2 bg-muted items-center">
      <dt className="tracking-tighter font-semibold">{label}</dt>
      <dd>
        <div
          className={cn(
            "size-3 text-transparent overflow-hidden rounded-full",
            value ? "bg-green-500" : "bg-red-500",
          )}
        >
          {value ? "true" : "false"}
        </div>
      </dd>
    </div>
  );
}
