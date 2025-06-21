"use client";

import { useContext, useEffect, useLayoutEffect } from "react";
import {
	getTabbableElements,
	getTabbableElementsAsync,
	safelyFocusElement,
} from "./utils";
import {
	useGridDataDispatch,
	useGridListState,
	useGridListDispatch,
	GridListBodyContext,
	useGridDataState,
	SelectionIndicatorContext,
	RowContext,
	GridContentContext,
} from "./state";

export function useRegisterRow(
	rowId: string,
	readOnly?: boolean,
	disabled?: boolean,
	data?: unknown,
) {
	const dispatch = useGridDataDispatch();
	const isInsideBody = useContext(GridListBodyContext);

	useEffect(() => {
		// Only register rows that are inside GridListBody
		if (!isInsideBody) return;

		dispatch({ type: "addRow", rowId, readOnly, disabled, data });

		return () => {
			dispatch({ type: "removeRow", rowId });
		};
	}, [dispatch, rowId, readOnly, disabled, isInsideBody, data]);

	// FIXME: check if this is needed
	useEffect(() => {
		if (!isInsideBody) return;

		dispatch({ type: "updateRow", rowId, readOnly, disabled, data });
	}, [dispatch, rowId, readOnly, disabled, isInsideBody, data]);
}

export function useFocusRow() {
	const { containerRef } = useContext(GridContentContext);
	const dispatch = useGridListDispatch();

	return (rowId: string): boolean => {
		const container = containerRef?.current;
		if (!container) return false;

		const rowElement = container.querySelector(`[data-row-id="${rowId}"]`);
		if (!rowElement) {
			// If the row doesn't exist, clear the focus
			dispatch({
				type: "setLastFocusedRow",
				rowId: null,
			});
			return false;
		}

		// Check if the row is disabled
		const isDisabled = rowElement.getAttribute("data-disabled") === "true";
		if (isDisabled) {
			return false;
		}

		if (safelyFocusElement(rowElement)) {
			dispatch({
				type: "setLastFocusedRow",
				rowId,
			});

			return true;
		}

		return false;
	};
}

export function useFocusFirstRow() {
	const containerRef = useContainerRef();
	const focusRow = useFocusRow();
	const { rows: dataRows } = useGridDataState();

	return () => {
		const container = containerRef?.current;
		if (!container) return;

		// Find the first non-disabled row
		const rows = container.querySelectorAll("[data-row-id]");
		for (const row of rows) {
			const dataRow = dataRows.find(
				(r) => r.rowId === row.getAttribute("data-row-id"),
			);

			if (!dataRow) {
				// if it is not a registered row, skip it
				continue;
			}

			const isDisabled = row.getAttribute("data-disabled") === "true";
			if (isDisabled) continue;

			const id = row.getAttribute("data-row-id");
			if (!id) continue;

			if (focusRow(id)) {
				break;
			}
		}
	};
}

export function useHandleTab() {
	const endRef = useEndRef();
	const containerRef = useContainerRef();
	useEffect(() => {
		const sentinelEnd = endRef?.current;
		if (!sentinelEnd) {
			return;
		}

		const container = containerRef?.current;
		if (!container) {
			return;
		}

		const handleTab = async (event: KeyboardEvent) => {
			if (event.key !== "Tab") {
				return;
			}

			if (event.shiftKey) {
				return;
			}

			event.preventDefault();
			const allTabbableElements = await getTabbableElementsAsync(document.body);

			if (!sentinelEnd) {
				console.error("sentinel end is not defined");
				// this can't happen
				return;
			}

			const sentinelEndIndex = allTabbableElements.indexOf(sentinelEnd);
			const lookupIndex = sentinelEndIndex + 1;

			if (sentinelEndIndex === -1) {
				console.error("sentinel end is not in the list of tabbable elements");
				// this can't happen
				return;
			}

			// find the first tabbable element after the sentinel end
			const firstTabbableElementAfterSentinelEnd =
				allTabbableElements[lookupIndex];

			// if the grid is the last tabbable element, focus the first tabbable element
			if (!firstTabbableElementAfterSentinelEnd) {
				allTabbableElements[0]?.focus();
				return;
			}

			// if the next tabbable element is a start sentinel, we need to focus on its last focused row or first row
			if (
				firstTabbableElementAfterSentinelEnd.hasAttribute(
					"data-focus-scope-start",
				)
			) {
				const container =
					firstTabbableElementAfterSentinelEnd.closest("[role='grid']");
				if (container && safelyFocusElement(container)) {
					return;
				}
			}

			firstTabbableElementAfterSentinelEnd?.focus();
		};

		container.addEventListener("keydown", handleTab);

		return () => {
			container.removeEventListener("keydown", handleTab);
		};
	}, [endRef, containerRef]);
}

export function useHandleShiftTab() {
	const startRef = useStartRef();
	const containerRef = useContainerRef();
	useEffect(() => {
		const sentinelStart = startRef?.current;
		if (!sentinelStart) {
			return;
		}

		const container = containerRef?.current;
		if (!container) {
			return;
		}

		const handleShiftTab = async (event: KeyboardEvent) => {
			if (event.key !== "Tab") {
				return;
			}

			if (!event.shiftKey) {
				return;
			}

			event.preventDefault();
			const allTabbableElements = await getTabbableElementsAsync(document.body);

			const sentinelStartIndex = allTabbableElements.indexOf(sentinelStart);
			const lookupIndex = sentinelStartIndex - 1;

			if (sentinelStartIndex === -1) {
				console.error("sentinel start is not in the list of tabbable elements");
				// this can't happen
				return;
			}

			// find the first tabbable element before the sentinel start
			const lastTabbableElementBeforeSentinelStart =
				allTabbableElements[lookupIndex];

			// if the grid is the first tabbable element, focus the last tabbable element
			if (!lastTabbableElementBeforeSentinelStart) {
				allTabbableElements[allTabbableElements.length - 1]?.focus();
				return;
			}

			// if the last tabbable element is an end sentinel, we need to focus on its container
			if (
				lastTabbableElementBeforeSentinelStart.hasAttribute(
					"data-focus-scope-end",
				)
			) {
				const container =
					lastTabbableElementBeforeSentinelStart.closest("[role='grid']");

				if (container && safelyFocusElement(container)) {
					return;
				}
			}

			lastTabbableElementBeforeSentinelStart?.focus();
		};

		container.addEventListener("keydown", handleShiftTab);

		return () => {
			container.removeEventListener("keydown", handleShiftTab);
		};
	}, [startRef, containerRef]);
}

export function useHandleUpArrow() {
	const { cycleRowFocus } = useGridListState();
	const containerRef = useContainerRef();
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

			// find previous row using selector (exclude disabled rows)
			const allRows = container.querySelectorAll(
				"[data-row-id]:not([data-disabled='true'])",
			);

			const currentRowIndex = Array.from(allRows).findIndex(
				(row) => row === currentRowElement,
			);
			if (currentRowIndex === -1) return;

			const targetRowIndex = currentRowIndex - 1;

			// If we're at the first row and cycling is enabled, go to the last row
			if (targetRowIndex < 0) {
				if (cycleRowFocus && allRows.length > 0) {
					const lastRow = allRows[allRows.length - 1];
					const id = lastRow.getAttribute("data-row-id");
					if (id) {
						focusRow(id);
					}
				}
				return;
			}

			const targetRow = allRows[targetRowIndex];

			const id = targetRow.getAttribute("data-row-id");
			if (!id) return;

			focusRow(id);
		};

		container.addEventListener("keydown", handleUpArrow);

		return () => {
			container.removeEventListener("keydown", handleUpArrow);
		};
	}, [containerRef, focusRow, cycleRowFocus]);
}

export function useHandleDownArrow() {
	const { cycleRowFocus } = useGridListState();
	const focusRow = useFocusRow();
	const containerRef = useContainerRef();

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

			const currentRowElement = activeElement.closest("[data-row-id]");
			if (!currentRowElement) return;

			const allRows = container.querySelectorAll(
				"[data-row-id]:not([data-disabled='true'])",
			);
			const currentRowIndex = Array.from(allRows).findIndex(
				(row) => row === currentRowElement,
			);
			if (currentRowIndex === -1) return;

			const targetRowIndex = currentRowIndex + 1;

			// If we're at the last row and cycling is enabled, go to the first row
			if (targetRowIndex >= allRows.length) {
				if (cycleRowFocus && allRows.length > 0) {
					const firstRow = allRows[0];
					const id = firstRow.getAttribute("data-row-id");
					if (id) {
						focusRow(id);
					}
				}
				return;
			}

			const targetRow = allRows[targetRowIndex];
			const id = targetRow.getAttribute("data-row-id");
			if (!id) return;

			focusRow(id);
		};

		container.addEventListener("keydown", handleDownArrow);

		return () => {
			container.removeEventListener("keydown", handleDownArrow);
		};
	}, [containerRef, focusRow, cycleRowFocus]);
}

export function useHandleLeftArrow() {
	const containerRef = useContainerRef();

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

			// Check if currently focused element is the row itself
			const isRowFocused = activeElement === currentRowElement;

			if (isRowFocused) {
				// If row is focused, go to the last tabbable element
				const lastElement = allTabbableElements[allTabbableElements.length - 1];
				if (lastElement) {
					lastElement.focus();
				}
				return;
			}

			const currentTabbableIndex = allTabbableElements.indexOf(
				activeElement as HTMLElement,
			);
			if (currentTabbableIndex === -1) {
				// focus the first tabbable element
				allTabbableElements[0]?.focus();
				return;
			}

			const targetTabbableIndex = currentTabbableIndex - 1;
			if (targetTabbableIndex < 0) {
				// Cycle back to the row element
				if (currentRowElement instanceof HTMLElement) {
					currentRowElement.focus();
				}
				return;
			}

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

export function useHandleRightArrow() {
	const containerRef = useContainerRef();

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

			// Check if currently focused element is the row itself
			const isRowFocused = activeElement === currentRowElement;

			if (isRowFocused) {
				// If row is focused, go to the first tabbable element
				const firstElement = allTabbableElements[0];
				if (firstElement) {
					firstElement.focus();
				}
				return;
			}

			const currentTabbableIndex = allTabbableElements.indexOf(
				activeElement as HTMLElement,
			);
			if (currentTabbableIndex === -1) {
				// focus the last tabbable element
				allTabbableElements[allTabbableElements.length - 1]?.focus();
				return;
			}

			const targetTabbableIndex = currentTabbableIndex + 1;
			if (targetTabbableIndex >= allTabbableElements.length) {
				// Cycle back to the row element
				if (currentRowElement instanceof HTMLElement) {
					currentRowElement.focus();
				}
				return;
			}

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

export function useHandleSpacebar(
	rowRef: React.RefObject<HTMLDivElement | null>,
) {
	const { onCheckedChange, selected } = useContext(SelectionIndicatorContext);

	useEffect(() => {
		const rowElement = rowRef?.current;
		if (!rowElement) return;

		const handleSpacebar = (event: KeyboardEvent) => {
			if (event.key !== " " && event.key !== "Spacebar") {
				return;
			}

			// check if the focus is on the row element itself
			if (document.activeElement !== rowElement) {
				return;
			}

			event.preventDefault();

			// Toggle row selection
			onCheckedChange?.(!selected);
		};

		rowElement.addEventListener("keydown", handleSpacebar);

		return () => {
			rowElement.removeEventListener("keydown", handleSpacebar);
		};
	}, [rowRef, onCheckedChange, selected]);
}

export function useGridListTabIndexManager(children: React.ReactNode) {
	const containerRef = useContainerRef();
	const { rows } = useGridDataState();

	// biome-ignore lint/correctness/useExhaustiveDependencies: we need to re-run this effect when the children change
	useLayoutEffect(() => {
		const container = containerRef?.current;
		if (!container) return;

		// Find the first registered, non-disabled row
		const allRows = container.querySelectorAll("[data-row-id]");
		let firstValidRow: Element | null = null;

		for (const row of allRows) {
			const rowId = row.getAttribute("data-row-id");
			if (!rowId) continue;

			const dataRow = rows.find((r) => r.rowId === rowId);
			if (!dataRow) {
				// if it is not a registered row, skip it
				continue;
			}

			if (dataRow.disabled) continue;

			firstValidRow = row;
			break;
		}

		// set tabIndex=0 for the first registered, non-disabled row
		if (firstValidRow) {
			firstValidRow.setAttribute("tabindex", "0");
		}

		return () => {
			// set all rows to tabindex=-1
			const allRows = container.querySelectorAll("[data-row-id]");
			for (const row of allRows) {
				const rowId = row.getAttribute("data-row-id");
				if (!rowId) continue;

				const dataRow = rows.find((r) => r.rowId === rowId);
				if (!dataRow) continue;

				row.setAttribute("tabindex", "-1");
			}
		};
	}, [children, rows]);
}

export function useRowData<T>(): T | undefined {
	const { data } = useContext(RowContext);
	return data as T | undefined;
}

function useContainerRef() {
	const { containerRef } = useContext(GridContentContext);
	return containerRef;
}

function useEndRef() {
	const { endRef } = useContext(GridContentContext);
	return endRef;
}

function useStartRef() {
	const { startRef } = useContext(GridContentContext);
	return startRef;
}
