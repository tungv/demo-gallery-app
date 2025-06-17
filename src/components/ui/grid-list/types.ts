import type { FormEventHandler } from "react";

// Grid Data Types - for managing row data
export type GridDataState = {
	rows: Array<{ rowId: string; readOnly?: boolean; disabled?: boolean }>;
};

export type GridDataAction =
	| {
			type: "addRow";
			rowId: string;
			readOnly?: boolean;
			disabled?: boolean;
	  }
	| {
			type: "removeRow";
			rowId: string;
	  }
	| {
			type: "updateRow";
			rowId: string;
			readOnly?: boolean;
			disabled?: boolean;
	  };

// Selection State Types - for managing selection
export type SelectionState = {
	selectionMode: "none" | "single" | "multiple";
	selectedRows: Set<string>;
};

export type SelectionAction =
	| {
			type: "selectRow";
			rowId: string;
	  }
	| {
			type: "deselectRow";
			rowId: string;
	  }
	| {
			type: "toggleRowSelection";
			rowId: string;
	  }
	| {
			type: "clearSelection";
			rows?: Array<{ rowId: string; readOnly?: boolean; disabled?: boolean }>;
	  }
	| {
			type: "selectAllRows";
			allRows: Array<{
				rowId: string;
				readOnly?: boolean;
				disabled?: boolean;
			}>;
	  }
	| {
			type: "setSelectedRows";
			selectedRows: string[];
	  };

// Grid State Types - for managing focus and navigation (selection removed)
export type GridState = {
	lastFocusedRowId: string | null;
	isFocusWithinContainer: boolean;
	containerRef?: React.RefObject<HTMLDivElement | null>;
	startRef?: React.RefObject<HTMLSpanElement | null>;
	endRef?: React.RefObject<HTMLSpanElement | null>;
	cycleRowFocus: boolean;
	name?: string;
	required?: boolean;
};

export type GridAction =
	| {
			type: "setLastFocusedRow";
			rowId: string | null;
	  }
	| {
			type: "setFocusWithinContainer";
			isFocusWithinContainer: boolean;
	  };

export type ValueOnChangeMode =
	| {
			selectionMode: "multiple";
			initialValue?: string[];
			value?: string[];
			onValueChange?: (value: string[]) => void;
	  }
	| {
			selectionMode: "single";
			initialValue?: string;
			value?: string;
			onValueChange?: (value: string) => void;
	  }
	| {
			selectionMode: "none";
			initialValue?: undefined;
			value?: undefined;
			onValueChange?: undefined;
	  };

export type GridListRootProps = {
	children: React.ReactNode;
	cycleRowFocus?: boolean;
	selectionMode?: "none" | "single" | "multiple";
	name?: string;
	required?: boolean;
	onInvalid?: FormEventHandler<HTMLSelectElement>;
} & React.HTMLAttributes<HTMLDivElement> &
	ValueOnChangeMode;

export type GridListRowProps = {
	children: React.ReactNode;
	asChild?: boolean;
	rowId?: string;
	readOnly?: boolean;
	disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;
