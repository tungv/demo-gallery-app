# GridList

A comprehensive grid list component with selection support, keyboard navigation, and accessibility features. Built with React Server Components and WAI-ARIA compliance.

## Features

- Supports single and multiple selection modes
- Keyboard navigation with arrow keys and spacebar
- Focus management and tab order
- Read-only and disabled row states
- Sortable column headers
- Form integration with hidden inputs
- WAI-ARIA compliant grid pattern
- Server-side rendering compatible
- Fully customizable styling

## Component Reference

### Installation

The GridList components are part of the UI component library and don't require separate installation.

## Anatomy

Import all parts and piece them together:

```tsx
import {
  GridListContainer,
  GridListContent,
  GridHeader,
  GridBody,
  GridFooter,
  GridListRow,
  GridListColumnHeader,
  GridListRowHeader,
  GridListCell,
  GridListTitle,
  GridListCaption,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListItemIndeterminateIndicator,
} from "@/components/ui/grid-list";

export default () => (
  <GridListContainer>
    <GridListTitle />
    <GridListCaption />
    <GridListContent>
      <GridHeader>
        <GridListRow>
          <GridListColumnHeader />
          <GridListColumnHeader />
        </GridListRow>
      </GridHeader>
      <GridBody>
        <GridListRow>
          <GridListCell>
            <GridListItemIndicatorRoot>
              <GridListItemSelectedIndicator />
              <GridListItemUnselectedIndicator />
              <GridListItemIndeterminateIndicator />
            </GridListItemIndicatorRoot>
          </GridListCell>
          <GridListRowHeader />
          <GridListCell />
        </GridListRow>
      </GridBody>
      <GridFooter>{/* Footer content */}</GridFooter>
    </GridListContent>
  </GridListContainer>
);
```

## API Reference

### GridListContainer

The root container that manages state and provides context for all grid components.

| Prop            | Type                                  | Default     | Description                                       |
| --------------- | ------------------------------------- | ----------- | ------------------------------------------------- |
| `selectionMode` | `"none" \| "single" \| "multiple"`    | `"none"`    | Controls how rows can be selected                 |
| `initialValue`  | `string \| string[]`                  | `undefined` | Initial selected rows (uncontrolled)              |
| `value`         | `string \| string[]`                  | `undefined` | Selected rows (controlled)                        |
| `onValueChange` | `(value: string \| string[]) => void` | `undefined` | Called when selection changes                     |
| `name`          | `string`                              | `undefined` | Form field name for hidden inputs                 |
| `required`      | `boolean`                             | `false`     | Whether selection is required for form validation |
| `cycleRowFocus` | `boolean`                             | `false`     | Whether focus should cycle at list boundaries     |
| `onInvalid`     | `FormEventHandler<HTMLSelectElement>` | `undefined` | Called when form validation fails                 |

### GridListContent

The main grid container that renders the visual grid structure.

| Prop        | Type     | Default     | Description             |
| ----------- | -------- | ----------- | ----------------------- |
| `className` | `string` | `undefined` | CSS classes for styling |
| `id`        | `string` | `undefined` | HTML id attribute       |

### GridHeader

Container for column headers and grid header content.

| Prop        | Type     | Default     | Description             |
| ----------- | -------- | ----------- | ----------------------- |
| `className` | `string` | `undefined` | CSS classes for styling |

### GridBody

Container for the main grid data rows.

| Prop        | Type     | Default     | Description             |
| ----------- | -------- | ----------- | ----------------------- |
| `className` | `string` | `undefined` | CSS classes for styling |

### GridFooter

Container for grid footer content and actions.

| Prop        | Type     | Default     | Description             |
| ----------- | -------- | ----------- | ----------------------- |
| `className` | `string` | `undefined` | CSS classes for styling |

### GridListRow

A row in the grid that can be selected and focused.

| Prop        | Type      | Default     | Description                   |
| ----------- | --------- | ----------- | ----------------------------- |
| `rowId`     | `string`  | `undefined` | Unique identifier for the row |
| `asChild`   | `boolean` | `false`     | Render as child component     |
| `readOnly`  | `boolean` | `false`     | Whether the row is read-only  |
| `disabled`  | `boolean` | `false`     | Whether the row is disabled   |
| `rowData`   | `unknown` | `undefined` | Associated data for the row   |
| `className` | `string`  | `undefined` | CSS classes for styling       |

### GridListColumnHeader

A column header cell with optional sorting functionality.

| Prop            | Type                                    | Default     | Description                    |
| --------------- | --------------------------------------- | ----------- | ------------------------------ |
| `sortable`      | `boolean`                               | `false`     | Whether the column is sortable |
| `sortDirection` | `"ascending" \| "descending" \| "none"` | `"none"`    | Current sort direction         |
| `onSort`        | `() => void`                            | `undefined` | Called when sort is triggered  |
| `colSpan`       | `number`                                | `undefined` | Number of columns to span      |
| `asChild`       | `boolean`                               | `false`     | Render as child component      |
| `className`     | `string`                                | `undefined` | CSS classes for styling        |

### GridListRowHeader

A row header cell that identifies the row.

| Prop        | Type                  | Default     | Description               |
| ----------- | --------------------- | ----------- | ------------------------- |
| `scope`     | `"row" \| "rowgroup"` | `"row"`     | ARIA scope attribute      |
| `rowSpan`   | `number`              | `undefined` | Number of rows to span    |
| `asChild`   | `boolean`             | `false`     | Render as child component |
| `className` | `string`              | `undefined` | CSS classes for styling   |

### GridListCell

A generic cell component for grid data.

| Prop        | Type      | Default     | Description               |
| ----------- | --------- | ----------- | ------------------------- |
| `asChild`   | `boolean` | `false`     | Render as child component |
| `className` | `string`  | `undefined` | CSS classes for styling   |

### GridListTitle

An accessible title for the grid.

| Prop        | Type      | Default     | Description               |
| ----------- | --------- | ----------- | ------------------------- |
| `asChild`   | `boolean` | `false`     | Render as child component |
| `className` | `string`  | `undefined` | CSS classes for styling   |

### GridListCaption

An accessible caption/description for the grid.

| Prop        | Type      | Default     | Description               |
| ----------- | --------- | ----------- | ------------------------- |
| `asChild`   | `boolean` | `false`     | Render as child component |
| `className` | `string`  | `undefined` | CSS classes for styling   |

### GridListItemIndicatorRoot

The root component for selection indicators (checkboxes).

| Prop            | Type     | Default      | Description                          |
| --------------- | -------- | ------------ | ------------------------------------ |
| `selectLabel`   | `string` | `"Select"`   | Accessible label for select action   |
| `deselectLabel` | `string` | `"Deselect"` | Accessible label for deselect action |
| `className`     | `string` | `undefined`  | CSS classes for styling              |

### GridListItemSelectedIndicator

Visual indicator shown when a row is selected.

| Prop       | Type        | Default     | Description                |
| ---------- | ----------- | ----------- | -------------------------- |
| `children` | `ReactNode` | `undefined` | Icon or content to display |

### GridListItemUnselectedIndicator

Visual indicator shown when a row is not selected.

| Prop       | Type        | Default     | Description                |
| ---------- | ----------- | ----------- | -------------------------- |
| `children` | `ReactNode` | `undefined` | Icon or content to display |

### GridListItemIndeterminateIndicator

Visual indicator shown when selection is indeterminate (for header checkboxes).

| Prop       | Type        | Default     | Description                |
| ---------- | ----------- | ----------- | -------------------------- |
| `children` | `ReactNode` | `undefined` | Icon or content to display |

## Examples

### Basic Grid with Multiple Selection

```tsx
import { Form, FormSubmit } from "@/components/ui/form";
import {
  GridListContainer,
  GridListContent,
  GridHeader,
  GridBody,
  GridFooter,
  GridListRow,
  GridListColumnHeader,
  GridListRowHeader,
  GridListTitle,
  GridListCaption,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
} from "@/components/ui/grid-list";
import { CheckSquare2, Square } from "lucide-react";

export default function BasicGrid() {
  return (
    <Form
      action={async (formData) => {
        "use server";
        console.log(formData.getAll("selection"));
      }}
    >
      <GridListContainer
        selectionMode="multiple"
        name="selection"
        initialValue={["1", "3"]}
      >
        <GridListTitle>Users</GridListTitle>
        <GridListCaption>Select users to perform bulk actions</GridListCaption>
        <GridListContent className="border rounded-lg">
          <GridHeader>
            <GridListRow>
              <GridListColumnHeader>
                <GridListItemIndicatorRoot>
                  <GridListItemSelectedIndicator>
                    <CheckSquare2 />
                  </GridListItemSelectedIndicator>
                  <GridListItemUnselectedIndicator>
                    <Square />
                  </GridListItemUnselectedIndicator>
                </GridListItemIndicatorRoot>
              </GridListColumnHeader>
              <GridListColumnHeader>Name</GridListColumnHeader>
              <GridListColumnHeader>Email</GridListColumnHeader>
            </GridListRow>
          </GridHeader>

          <GridBody>
            <GridListRow rowId="1">
              <GridListCell>
                <GridListItemIndicatorRoot>
                  <GridListItemSelectedIndicator>
                    <CheckSquare2 />
                  </GridListItemSelectedIndicator>
                  <GridListItemUnselectedIndicator>
                    <Square />
                  </GridListItemUnselectedIndicator>
                </GridListItemIndicatorRoot>
              </GridListCell>
              <GridListRowHeader>John Doe</GridListRowHeader>
              <GridListCell>john@example.com</GridListCell>
            </GridListRow>

            <GridListRow rowId="2">
              <GridListCell>
                <GridListItemIndicatorRoot>
                  <GridListItemSelectedIndicator>
                    <CheckSquare2 />
                  </GridListItemSelectedIndicator>
                  <GridListItemUnselectedIndicator>
                    <Square />
                  </GridListItemUnselectedIndicator>
                </GridListItemIndicatorRoot>
              </GridListCell>
              <GridListRowHeader>Jane Smith</GridListRowHeader>
              <GridListCell>jane@example.com</GridListCell>
            </GridListRow>
          </GridBody>
        </GridListContent>
      </GridListContainer>

      <FormSubmit>Submit</FormSubmit>
    </Form>
  );
}
```

### Controlled Selection

```tsx
import { useState } from "react";
import {
  GridListContainer,
  GridListContent,
  GridBody,
  GridListRow,
} from "@/components/ui/grid-list";

export default function ControlledGrid() {
  const [selectedRows, setSelectedRows] = useState<string[]>(["1"]);

  return (
    <GridListContainer
      selectionMode="multiple"
      value={selectedRows}
      onValueChange={setSelectedRows}
    >
      <GridListContent>
        <GridBody>
          <GridListRow rowId="1">Row 1</GridListRow>
          <GridListRow rowId="2">Row 2</GridListRow>
          <GridListRow rowId="3">Row 3</GridListRow>
        </GridBody>
      </GridListContent>
    </GridListContainer>
  );
}
```

### Disabled and Read-only Rows

```tsx
import {
  GridListContainer,
  GridListContent,
  GridBody,
  GridListRow,
} from "@/components/ui/grid-list";

export default function DisabledGrid() {
  return (
    <GridListContainer selectionMode="multiple">
      <GridListContent>
        <GridBody>
          <GridListRow rowId="1">Normal row</GridListRow>
          <GridListRow rowId="2" readOnly>
            Read-only row
          </GridListRow>
          <GridListRow rowId="3" disabled>
            Disabled row
          </GridListRow>
        </GridBody>
      </GridListContent>
    </GridListContainer>
  );
}
```

### Sortable Columns

```tsx
import { useState } from "react";
import {
  GridListContainer,
  GridListContent,
  GridHeader,
  GridListRow,
  GridListColumnHeader,
} from "@/components/ui/grid-list";

export default function SortableGrid() {
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending" | "none"
  >("none");

  const handleSort = () => {
    setSortDirection((current) =>
      current === "none"
        ? "ascending"
        : current === "ascending"
          ? "descending"
          : "none",
    );
  };

  return (
    <GridListContainer>
      <GridListContent>
        <GridHeader>
          <GridListRow>
            <GridListColumnHeader
              sortable
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Name
            </GridListColumnHeader>
          </GridListRow>
        </GridHeader>
      </GridListContent>
    </GridListContainer>
  );
}
```

## Accessibility

Adheres to the [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard Interactions

| Key             | Description                          |
| --------------- | ------------------------------------ |
| `Tab`           | Moves focus into and out of the grid |
| `Arrow Keys`    | Navigate between grid cells          |
| `Space`         | Toggle row selection                 |
| `Shift + Space` | Extend selection (multiple mode)     |
| `Ctrl/Cmd + A`  | Select all rows (multiple mode)      |
| `Escape`        | Clear selection                      |

### Screen Reader Support

- Grid is properly labeled with `aria-label` or `aria-labelledby`
- Row and column headers are identified with appropriate roles
- Selection state is announced when changed
- Focus changes are announced appropriately

## Advanced Usage

### Custom Selection Indicators

You can create custom selection indicators by composing the indicator components:

```tsx
function CustomCheckbox() {
  return (
    <GridListItemIndicatorRoot className="custom-checkbox">
      <GridListItemSelectedIndicator>
        <CheckIcon className="text-green-600" />
      </GridListItemSelectedIndicator>
      <GridListItemUnselectedIndicator>
        <div className="border-2 border-gray-300 w-4 h-4 rounded" />
      </GridListItemUnselectedIndicator>
      <GridListItemIndeterminateIndicator>
        <MinusIcon className="text-blue-600" />
      </GridListItemIndeterminateIndicator>
    </GridListItemIndicatorRoot>
  );
}
```

### Form Integration

The GridList automatically generates hidden form inputs when a `name` prop is provided:

```tsx
<GridListContainer name="selected-users" selectionMode="multiple">
  {/* Hidden inputs will be generated automatically */}
  {/* <input type="hidden" name="selected-users" value="1" /> */}
  {/* <input type="hidden" name="selected-users" value="3" /> */}
</GridListContainer>
```

### Debug Mode

Use the debug component to visualize internal state during development:

```tsx
import { GridListDebugger } from "@/components/ui/grid-list";

<GridFooter>
  <GridListDebugger />
</GridFooter>;
```

## Best Practices

1. **Always provide meaningful labels** using `GridListTitle` and `GridListCaption`
2. **Use semantic row headers** with `GridListRowHeader` for the primary cell in each row
3. **Implement proper loading states** when data is being fetched
4. **Test keyboard navigation** to ensure all interactions work without a mouse
5. **Consider performance** for large datasets - implement virtualization if needed
6. **Provide clear visual feedback** for selection states and disabled rows
