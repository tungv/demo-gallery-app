"use client";

import { createReducerContext } from "@/utils/reducer-context";
import { createContext, useContext } from "react";
import type {
	GridAction,
	GridDataAction,
	GridDataState,
	GridLabelingAction,
	GridLabelingState,
	GridState,
	SelectionAction,
	SelectionState,
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

const defaultGridLabelingState: GridLabelingState = {
	labelIds: [],
	captionIds: [],
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
						data: action.data,
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
					? {
							...row,
							readOnly: action.readOnly,
							disabled: action.disabled,
							data: action.data,
						}
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

function gridLabelingReducer(
	state: GridLabelingState,
	action: GridLabelingAction,
): GridLabelingState {
	switch (action.type) {
		case "addLabel":
			if (state.labelIds.includes(action.id)) {
				return state;
			}
			return {
				...state,
				labelIds: [...state.labelIds, action.id],
			};
		case "removeLabel":
			return {
				...state,
				labelIds: state.labelIds.filter((id) => id !== action.id),
			};
		case "addCaption":
			if (state.captionIds.includes(action.id)) {
				return state;
			}
			return {
				...state,
				captionIds: [...state.captionIds, action.id],
			};
		case "removeCaption":
			return {
				...state,
				captionIds: state.captionIds.filter((id) => id !== action.id),
			};
		default:
			return state;
	}
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
	data?: unknown;
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

// Grid Labeling Provider
export const [
	GridLabelingProvider,
	useGridLabelingState,
	useGridLabelingDispatch,
] = createReducerContext(gridLabelingReducer, defaultGridLabelingState);

// Internal hook for accessing selected rows
export function useSelectedRows() {
	const controlledValue = useContext(ControlledValueContext);
	const { selectedRows } = useSelectionState();
	const { rows } = useGridDataState();

	// Create a set of valid row IDs that currently exist in the table
	const validRowIds = new Set(rows.map((row) => row.rowId));

	// Filter selected rows to only include those that still exist in the table
	const actualSelectedRows =
		controlledValue == null ? selectedRows : new Set(controlledValue);
	const filteredSelectedRows = new Set(
		Array.from(actualSelectedRows).filter((rowId) => validRowIds.has(rowId)),
	);

	return filteredSelectedRows;
}

export function useSelectedRowsData<T>(): ReadonlyArray<
	GridDataState["rows"][number] & { data: T }
> {
	const selectedRows = useSelectedRows();
	const { rows } = useGridDataState();

	return rows.filter((row) => selectedRows.has(row.rowId)) as ReadonlyArray<
		GridDataState["rows"][number] & { data: T }
	>;
}

export function useFocusedRowData<T>(): T | undefined {
	const { lastFocusedRowId } = useGridListState();
	const { rows } = useGridDataState();

	if (lastFocusedRowId == null) {
		return undefined;
	}

	return rows.find((row) => row.rowId === lastFocusedRowId)?.data as T;
}
