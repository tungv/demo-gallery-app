"use client";

import { useContext, useEffect, useLayoutEffect } from "react";
import {
	GridContentContext,
	GridListBodyContext,
	RowContext,
	SelectionIndicatorContext,
	useGridDataDispatch,
	useGridDataState,
	useGridListDispatch,
	useGridListState,
	useSelectionDispatch,
	useSelectionState,
} from "./state";
import {
	getFocusableElements,
	getTabbableElements,
	isRowVisible,
	safelyFocusElement,
} from "./utils";

export function useRegisterRow(
	rowId: string,
	readOnly?: boolean,
	disabled?: boolean,
	data?: unknown,
	selectionIds?: readonly string[],
) {
	const dispatch = useGridDataDispatch();
	const isInsideBody = useContext(GridListBodyContext);

	useEffect(() => {
		if (!isInsideBody) return;
		dispatch({ type: "addRow", rowId });
		return () => dispatch({ type: "removeRow", rowId });
	}, [dispatch, rowId, isInsideBody]);

	useEffect(() => {
		if (isInsideBody) {
			dispatch({
				type: "updateRow",
				rowId,
				readOnly,
				disabled,
				data,
				selectionIds,
			});
		}
	}, [dispatch, rowId, readOnly, disabled, isInsideBody, data, selectionIds]);
}

export function useHandleSpacebar(
	rowRef: React.RefObject<HTMLDivElement | null>,
) {
	const { onCheckedChange, selected } = useContext(SelectionIndicatorContext);
	const { selectionMode } = useSelectionState();

	useEffect(() => {
		const row = rowRef.current;
		if (!row || selectionMode === "none") return;

		const handle = (event: KeyboardEvent) => {
			if (event.key !== " " || event.target !== row || event.defaultPrevented) {
				return;
			}
			event.preventDefault();
			onCheckedChange(!selected);
		};

		row.addEventListener("keydown", handle);
		return () => row.removeEventListener("keydown", handle);
	}, [rowRef, onCheckedChange, selected, selectionMode]);
}

/** Keep one grid tab stop; arrow keys expose actions without hidden focus sentinels. */
export function useGridListTabIndexManager(children: React.ReactNode) {
	const { containerRef } = useContext(GridContentContext);
	const { rows } = useGridDataState();
	const { lastFocusedRowId } = useGridListState();

	// biome-ignore lint/correctness/useExhaustiveDependencies: rendered children and row registrations both change the live tab stops.
	useLayoutEffect(() => {
		const container = containerRef?.current;
		if (!container) return;

		const elements = Array.from(
			container.querySelectorAll<HTMLElement>("[data-row-id]"),
		);
		const eligible = elements.filter(
			(row) => row.dataset.disabled !== "true" && isRowVisible(row),
		);
		const active =
			eligible.find((row) => row.dataset.rowId === lastFocusedRowId) ??
			eligible[0];

		for (const row of elements) {
			row.tabIndex = row === active ? 0 : -1;
			for (const control of row.querySelectorAll<HTMLElement>(
				"button, input, select, textarea, a[href], summary, [tabindex], [contenteditable='true']",
			)) {
				control.tabIndex = -1;
			}
		}
	}, [children, rows, containerRef, lastFocusedRowId]);
}

export function useRowData<T>(): T | undefined {
	return useContext(RowContext).data as T | undefined;
}

function moveToAction(
	row: HTMLElement,
	target: HTMLElement,
	direction: number,
) {
	const actions = getFocusableElements(row);
	if (!actions.length) return;

	const index = actions.indexOf(target);
	const next =
		target === row
			? direction > 0
				? actions[0]
				: actions.at(-1)
			: actions[index + direction];
	safelyFocusElement(next ?? row);
}

function leaveGrid(
	event: React.KeyboardEvent<HTMLDivElement>,
	container: HTMLElement,
) {
	const tabbable = getTabbableElements(document.body).filter(
		(element) => !container.contains(element),
	);
	const next = event.shiftKey
		? tabbable.findLast((element) =>
				Boolean(
					container.compareDocumentPosition(element) &
						Node.DOCUMENT_POSITION_PRECEDING,
				),
			)
		: tabbable.find((element) =>
				Boolean(
					container.compareDocumentPosition(element) &
						Node.DOCUMENT_POSITION_FOLLOWING,
				),
			);

	if (next) {
		event.preventDefault();
		next.focus();
	}
}

export function useGridListKeyboardHandlers() {
	const { cycleRowFocus } = useGridListState();
	const { containerRef } = useContext(GridContentContext);
	const dispatch = useGridListDispatch();
	const selectionDispatch = useSelectionDispatch();
	const { selectionMode } = useSelectionState();
	const { rows: dataRows } = useGridDataState();

	return (event: React.KeyboardEvent<HTMLDivElement>) => {
		const container = containerRef?.current;
		const target = event.target as HTMLElement;
		if (
			!container ||
			event.defaultPrevented ||
			target.closest("[role='grid']") !== container
		) {
			return;
		}

		if (event.key === "Tab") return leaveGrid(event, container);
		if (
			target.closest(
				"input, textarea, select, [contenteditable='true'], [role='combobox']",
			)
		) {
			return;
		}
		if (
			selectionMode === "multiple" &&
			(event.ctrlKey || event.metaKey) &&
			event.key.toLowerCase() === "a"
		) {
			event.preventDefault();
			selectionDispatch({ type: "selectAllRows", allRows: dataRows });
			return;
		}
		if (event.key === "Escape" && selectionMode !== "none") {
			event.preventDefault();
			selectionDispatch({ type: "clearSelection", rows: dataRows });
			return;
		}

		const row = target.closest<HTMLElement>("[data-row-id]");
		if (!row) return;
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			event.preventDefault();
			moveToAction(row, target, event.key === "ArrowRight" ? 1 : -1);
			return;
		}

		const rows = Array.from(
			container.querySelectorAll<HTMLElement>(
				"[data-row-id]:not([data-disabled='true'])",
			),
		).filter(isRowVisible);
		const index = rows.indexOf(row);
		const nextIndex = rowIndexForKey(
			event.key,
			index,
			rows.length,
			cycleRowFocus,
		);
		if (nextIndex === undefined) return;

		event.preventDefault();
		const next = rows[nextIndex];
		if (next && safelyFocusElement(next)) {
			dispatch({
				type: "setLastFocusedRow",
				rowId: next.dataset.rowId ?? null,
			});
		}
	};
}

function rowIndexForKey(
	key: string,
	index: number,
	count: number,
	cycle: boolean,
) {
	switch (key) {
		case "ArrowUp":
			return cycle ? (index - 1 + count) % count : Math.max(0, index - 1);
		case "ArrowDown":
			return cycle ? (index + 1) % count : Math.min(count - 1, index + 1);
		case "Home":
			return 0;
		case "End":
			return count - 1;
		case "PageUp":
			return Math.max(0, index - 10);
		case "PageDown":
			return Math.min(count - 1, index + 10);
		default:
			return undefined;
	}
}
