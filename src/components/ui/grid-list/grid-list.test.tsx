import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
	GridBody,
	GridListCell,
	GridListContainer,
	GridListContent,
	GridListRow,
} from "./components";
import { selectionIdsInRange, selectionReducer } from "./state";
import type { SelectionState } from "./types";

describe("grid list server rendering", () => {
	test("forwards labels to the semantic grid without browser globals", () => {
		const html = renderToStaticMarkup(
			<GridListContainer aria-label="Projects" aria-describedby="help">
				<GridListContent>
					<GridBody>
						<GridListRow rowId="project-1" readOnly>
							<GridListCell>Gallery</GridListCell>
							<GridListCell>
								<button type="button">Open</button>
							</GridListCell>
						</GridListRow>
					</GridBody>
				</GridListContent>
			</GridListContainer>,
		);

		expect(html).toMatch(
			/role="grid"[^>]*aria-label="Projects"[^>]*aria-describedby="help"/,
		);
		expect(html).toContain('role="rowgroup"');
		expect(html).toContain('aria-readonly="true"');
		expect(html.match(/role="gridcell"/g)).toHaveLength(2);
		expect(html).not.toContain("aria-selected");
		expect(html).not.toContain("data-focus-scope-sentinel");
	});

	test("supports polymorphic rows and announces multiple selection", () => {
		const html = renderToStaticMarkup(
			<GridListContainer selectionMode="multiple" aria-label="People">
				<GridListContent>
					<GridBody>
						<GridListRow rowId="person-1" asChild disabled>
							<section>
								<GridListCell>Person</GridListCell>
							</section>
						</GridListRow>
					</GridBody>
				</GridListContent>
			</GridListContainer>,
		);

		expect(html).toContain('aria-multiselectable="true"');
		expect(html).toMatch(/<section[^>]*role="row"/);
		expect(html).toContain('aria-disabled="true"');
	});
});

describe("grid list selection", () => {
	test("single selection replaces the previous full row ID", () => {
		const state: SelectionState = {
			selectionMode: "single",
			selectedRows: new Set(["project-alpha"]),
		};
		const next = selectionReducer(state, {
			type: "selectRow",
			rowId: "project-beta",
		});

		expect([...next.selectedRows]).toEqual(["project-beta"]);
		expect([...state.selectedRows]).toEqual(["project-alpha"]);
	});

	test("select all excludes disabled and read-only rows", () => {
		const state: SelectionState = {
			selectionMode: "multiple",
			selectedRows: new Set(["locked"]),
		};
		const rows = [
			{ rowId: "editable" },
			{ rowId: "disabled", disabled: true },
			{ rowId: "locked", readOnly: true },
			{ rowId: "unselected-locked", readOnly: true },
		];
		const selected = selectionReducer(state, {
			type: "selectAllRows",
			allRows: rows,
		});

		expect([...selected.selectedRows]).toEqual(["editable", "locked"]);
		expect([
			...selectionReducer(selected, {
				type: "clearSelection",
				rows,
			}).selectedRows,
		]).toEqual(["locked"]);
	});

	test("range selection follows visual order and expands composite rows", () => {
		const rows = [
			// Streamed registration order can differ from the rendered order.
			{ rowId: "after" },
			{ rowId: "disabled", disabled: true },
			{
				rowId: "stack",
				readOnly: true,
				selectionIds: ["stack-a", "stack-b"],
			},
			{ rowId: "before" },
			{ rowId: "locked", readOnly: true },
		];
		const visualOrder = ["before", "stack", "disabled", "locked", "after"];

		expect(selectionIdsInRange(rows, "before", "after", visualOrder)).toEqual([
			"before",
			"stack-a",
			"stack-b",
			"after",
		]);
		expect(selectionIdsInRange(rows, "after", "stack", visualOrder)).toEqual([
			"stack-a",
			"stack-b",
			"after",
		]);
	});
});
