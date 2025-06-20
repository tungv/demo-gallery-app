"use client";

import { Button } from "@/components/ui/button";
import { GridListRow, useSelectedRowsData } from "@/components/ui/grid-list";
import { bulkDeleteAction } from "./actions";

export default function ActionRow() {
	const selection = useSelectedRowsData();
	return (
		<GridListRow className="p-1">
			{selection.length > 0 && (
				<Button variant="outline" formAction={bulkDeleteAction}>
					Delete selected
				</Button>
			)}
		</GridListRow>
	);
}
