"use client";

import { Button } from "@/components/ui/button";
import { GridListRow, useSelectedRows } from "@/components/ui/grid-list";
import { bulkDeleteAction } from "./actions";

export default function ActionRow() {
  const selection = useSelectedRows();
  return (
    <GridListRow className="p-1">
      {selection.size > 0 && (
        <Button variant="outline" formAction={bulkDeleteAction}>
          Delete selected
        </Button>
      )}
    </GridListRow>
  );
}
