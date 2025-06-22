import type { FormEventHandler } from "react";

// Grid Data Types - for managing row data
export type GridDataState = {
	rows: Array<{
		rowId: string;
		readOnly?: boolean;
		disabled?: boolean;
		data?: unknown;
	}>;
};

export type GridDataAction =
	| {
			type: "addRow";
			rowId: string;
			readOnly?: boolean;
			disabled?: boolean;
			data?: unknown;
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
			data?: unknown;
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
	cycleRowFocus: boolean;
	name?: string;
	required?: boolean;
	_default?: boolean;
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

// Grid Labeling State Types - for managing ARIA labels and descriptions
export type GridLabelingState = {
	labelIds: string[];
	captionIds: string[];
};

export type GridLabelingAction =
	| {
			type: "addLabel";
			id: string;
	  }
	| {
			type: "removeLabel";
			id: string;
	  }
	| {
			type: "addCaption";
			id: string;
	  }
	| {
			type: "removeCaption";
			id: string;
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
			selectionMode?: "none";
			initialValue?: undefined;
			value?: undefined;
			onValueChange?: undefined;
	  };

export type GridListContentProps = {
	children: React.ReactNode;
	gridClassName?: string;
	scrollableContainerClassName?: string;
	scrollable?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className">;

export type GridListRootProps = {
	children: React.ReactNode;
	cycleRowFocus?: boolean;
	selectionMode?: "none" | "single" | "multiple";
	name?: string;
	required?: boolean;
	onInvalid?: FormEventHandler<HTMLSelectElement>;
	// WAI-ARIA labeling props for grid accessibility
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	// FIXME: MEDIUM PRIORITY - Add sorting support props
	// sortBy?: string;
	// sortDirection?: "ascending" | "descending" | "none";
	// onSort?: (column: string, direction: "ascending" | "descending") => void;
	// FIXME: MEDIUM PRIORITY - Add dynamic content props for large datasets
	// totalRows?: number;
	// totalColumns?: number;
} & React.HTMLAttributes<HTMLDivElement> &
	ValueOnChangeMode;

export type GridListRowProps = {
	children: React.ReactNode;
	asChild?: boolean;
	rowId?: string;
	readOnly?: boolean;
	disabled?: boolean;
	rowData?: unknown;
} & React.HTMLAttributes<HTMLDivElement>;

// FIXME: HIGH PRIORITY - Add cell component types for proper WAI-ARIA grid structure
// These new component types should be created:
// export type GridListCellProps = {
// 	children: React.ReactNode;
// 	role?: "gridcell" | "columnheader" | "rowheader";
// 	colSpan?: number;
// 	rowSpan?: number;
// 	readOnly?: boolean;
// } & React.HTMLAttributes<HTMLDivElement>;

export type GridListColumnHeaderProps = {
	children: React.ReactNode;
	sortable?: boolean;
	sortDirection?: "ascending" | "descending" | "none";
	onSort?: () => void;
	colSpan?: number;
	asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export type GridListRowHeaderProps = {
	children: React.ReactNode;
	rowSpan?: number;
	asChild?: boolean;
	scope?: "row" | "rowgroup";
} & React.HTMLAttributes<HTMLDivElement>;

export type GridListTitleProps = {
	children: React.ReactNode;
	asChild?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement>;

export type GridListCaptionProps = {
	children: React.ReactNode;
	asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement>;

export type GridListCellProps = {
	children: React.ReactNode;
	asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;
