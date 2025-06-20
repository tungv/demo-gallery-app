"use client";

import { cn } from "@/lib/utils";
import { memo } from "react";
import { GridListRow } from "./components";
import { useGridListState, useSelectedRows, useSelectionState } from "./state";

export const Debugger = memo(function Debugger() {
	const { isFocusWithinContainer, lastFocusedRowId, cycleRowFocus } =
		useGridListState();
	const { selectionMode } = useSelectionState();
	const selectedRows = useSelectedRows();

	return (
		<GridListRow>
			<dl className="text-sm bg-muted/50 p-1 rounded-md text-muted-foreground flex flex-row gap-8 col-span-full">
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
				<dt className="tracking-tight font-semibold">{label}</dt>
				<dd className="italic font-mono">NULL</dd>
			</div>
		);
	}

	return (
		<div className="flex flex-row gap-2 bg-muted items-center">
			<dt className="tracking-tight font-semibold">{label}</dt>
			<dd className="font-mono">{JSON.stringify(value)}</dd>
		</div>
	);
}

function BooleanValue({ label, value }: { label: string; value: boolean }) {
	return (
		<div className="flex flex-row gap-2 bg-muted items-center">
			<dt className="tracking-tight font-semibold">{label}</dt>
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
