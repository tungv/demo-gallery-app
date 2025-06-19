// Main grid list components
// FIXME: WAI-ARIA COMPLIANCE - Grid components need several accessibility improvements
//
// HIGH PRIORITY ITEMS:
// 1. Add grid labeling support (aria-label, aria-labelledby, aria-describedby)
// 2. Add role="rowgroup" to header, body, and footer components
// 3. Create individual cell components with proper roles (gridcell, columnheader, rowheader)
// 4. Add aria-readonly support for read-only cells/grids
//
// MEDIUM PRIORITY ITEMS:
// 5. Add sorting support with aria-sort attributes
// 6. Add aria-colindex/aria-rowindex for dynamic content scenarios
// 7. Add aria-colcount/aria-rowcount for total counts in large datasets
//
// LOW PRIORITY ITEMS:
// 8. Add aria-rowspan/aria-colspan support for spanning cells (if needed)
//
// See WAI-ARIA Grid Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/grid/

export {
  GridListRoot,
  GridListHeader,
  GridListBody,
  GridListFooter,
  GridListRow,
  GridListColumnHeader,
  GridListRowHeader,
  GridListTitle,
  GridListCaption,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListItemIndeterminateIndicator,
  GridListCell,
  GridCurrentFocusInput,
} from "./components";

// Types that consumers might need
export type {
  GridListRootProps,
  GridListRowProps,
  GridListColumnHeaderProps,
  GridListRowHeaderProps,
  GridListTitleProps,
  GridListCaptionProps,
} from "./types";

// FIXME: HIGH PRIORITY - Export new cell component types when created
// export type { GridListCellProps, GridListRowHeaderProps } from "./types";

// State hooks that might be useful for consumers
export { useSelectedRows, useSelectedRowsData } from "./state";

// Debug component for development
export { Debugger as GridListDebugger } from "./debug";

// FIXME: HIGH PRIORITY - Export new cell components when created
// export {
//   GridListCell,
// } from "./components";
