"use client";

import { createContext, useContext } from "react";
import { createReducerContext } from "@/utils/reducer-context";
import type {
	GridDataState,
	GridDataAction,
	SelectionState,
	SelectionAction,
	GridState,
	GridAction,
} from "./types";

const defaultGridDataState: GridDataState = {
	rows: [],
};

const defaultSelectionState: SelectionState = {
	selectionMode: "none",
	selectedRows: new Set(),
};

const defaultGridState: GridState = {
	lastFocusedRowId: null,
	isFocusWithinContainer: false,
	cycleRowFocus: false,
	name: undefined,
	required: false,
};

function gridDataReducer(
	state: GridDataState,
	action: GridDataAction,
): GridDataState {
	switch (action.type) {
		case "addRow":
			// check for existence before adding
			if (state.rows.some((row) => row.rowId === action.rowId)) {
				return state;
			}
			return {
				...state,
				rows: [
					...state.rows,
					{
						rowId: action.rowId,
						readOnly: action.readOnly,
						disabled: action.disabled,
					},
				],
			};
		case "removeRow": {
			const newRows = state.rows.filter((row) => row.rowId !== action.rowId);
			return {
				...state,
				rows: newRows,
			};
		}
		case "updateRow": {
			const newRows = state.rows.map((row) =>
				row.rowId === action.rowId
					? { ...row, readOnly: action.readOnly, disabled: action.disabled }
					: row,
			);
			return {
				...state,
				rows: newRows,
			};
		}
	}
	return state;
}

export function selectionReducer(
	state: SelectionState,
	action: SelectionAction,
): SelectionState {
	switch (action.type) {
		case "selectRow": {
			const newSelectedRows = new Set(state.selectedRows);
			if (state.selectionMode === "single") {
				newSelectedRows.clear();
			}
			newSelectedRows.add(action.rowId);
			return {
				...state,
				selectedRows: newSelectedRows,
			};
		}
		case "deselectRow": {
			const newSelectedRows = new Set(state.selectedRows);
			newSelectedRows.delete(action.rowId);
			return {
				...state,
				selectedRows: newSelectedRows,
			};
		}

		case "toggleRowSelection": {
			const newSelectedRows = new Set(state.selectedRows);
			if (newSelectedRows.has(action.rowId)) {
				newSelectedRows.delete(action.rowId);
			} else {
				if (state.selectionMode === "single") {
					newSelectedRows.clear();
				}
				newSelectedRows.add(action.rowId);
			}
			return {
				...state,
				selectedRows: newSelectedRows,
			};
		}

		case "clearSelection": {
			// Preserve read-only rows that are currently selected
			if (!action.rows) {
				return {
					...state,
					selectedRows: new Set(),
				};
			}

			const readOnlyRowIds = action.rows
				.filter((row) => row.readOnly)
				.map((row) => row.rowId);

			const preservedReadOnlySelections = readOnlyRowIds.filter((rowId) =>
				state.selectedRows.has(rowId),
			);

			return {
				...state,
				selectedRows: new Set(preservedReadOnlySelections),
			};
		}

		case "selectAllRows": {
			// Get selectable rows (not disabled and not read-only)
			const selectableRowIds = action.allRows
				.filter((row) => !row.disabled && !row.readOnly)
				.map((row) => row.rowId);

			// Start with the selectable rows to select
			const newSelectedRows = new Set(selectableRowIds);

			// Get read-only rows and preserve their previous selections
			const readOnlyRowIds = action.allRows
				.filter((row) => row.readOnly)
				.map((row) => row.rowId);

			// Add back any read-only rows that were previously selected
			for (const rowId of readOnlyRowIds) {
				if (state.selectedRows.has(rowId)) {
					newSelectedRows.add(rowId);
				}
			}

			return {
				...state,
				selectedRows: newSelectedRows,
			};
		}

		case "setSelectedRows": {
			return {
				...state,
				selectedRows: new Set(action.selectedRows),
			};
		}
	}

	return state;
}

// Grid Data Provider
export const [GridDataProvider, useGridDataState, useGridDataDispatch] =
	createReducerContext(gridDataReducer, defaultGridDataState);

// Selection State Provider
export const [SelectionStateProvider, useSelectionState, useSelectionDispatch] =
	createReducerContext(selectionReducer, defaultSelectionState);

// Grid State Provider (focus and navigation only)
export const [GridListStateProvider, useGridListState, useGridListDispatch] =
	createReducerContext((state: GridState, action: GridAction): GridState => {
		switch (action.type) {
			case "setLastFocusedRow":
				return {
					...state,
					lastFocusedRowId: action.rowId,
				};
			case "setFocusWithinContainer":
				if (state.isFocusWithinContainer === action.isFocusWithinContainer) {
					return state;
				}
				return {
					...state,
					isFocusWithinContainer: action.isFocusWithinContainer,
				};
		}

		return state;
	}, defaultGridState);

export const ControlledValueContext = createContext<Set<string> | null>(null);

export const RowContext = createContext<{
	rowId: string;
}>({
	rowId: "",
});

export const GridListBodyContext = createContext<boolean>(false);

export const SelectionIndicatorContext = createContext<{
	selected: boolean | "indeterminate";
	onCheckedChange: (checked: boolean) => void;
}>({
	selected: false,
	onCheckedChange: () => {},
});

// Internal hook for accessing selected rows
export function useSelectedRows() {
	const controlledValue = useContext(ControlledValueContext);
	const { selectedRows } = useSelectionState();
	return controlledValue == null ? selectedRows : new Set(controlledValue);
}
