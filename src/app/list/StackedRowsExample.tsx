"use client";

import {
	GridBody,
	GridHeader,
	GridListCaption,
	GridListCell,
	GridListColumnHeader,
	GridListContainer,
	GridListContent,
	GridListItemIndeterminateIndicator,
	GridListItemIndicatorRoot,
	GridListItemSelectedIndicator,
	GridListItemUnselectedIndicator,
	GridListRow,
	GridListRowHeader,
	GridListTitle,
} from "@/components/ui/grid-list";
import {
	CheckSquare2,
	ChevronDown,
	ChevronUp,
	Layers3,
	MinusSquare,
	Square,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";

const STACK_IDS = ["stack-detail-a", "stack-detail-b"] as const;

function SelectionCheckbox({
	label,
	onCheckedChange,
}: {
	label: string;
	onCheckedChange?: (checked: boolean) => void;
}) {
	return (
		<GridListItemIndicatorRoot
			selectLabel={`Select ${label}`}
			deselectLabel={`Deselect ${label}`}
			onCheckedChange={onCheckedChange}
		>
			<GridListItemSelectedIndicator>
				<CheckSquare2 className="size-4" />
			</GridListItemSelectedIndicator>
			<GridListItemUnselectedIndicator>
				<Square className="size-4" />
			</GridListItemUnselectedIndicator>
			<GridListItemIndeterminateIndicator>
				<MinusSquare className="size-4" />
			</GridListItemIndeterminateIndicator>
		</GridListItemIndicatorRoot>
	);
}

function DataRow({ rowId, title }: { rowId: string; title: string }) {
	return (
		<GridListRow
			rowId={rowId}
			className="items-center gap-3 rounded-sm p-2 data-[selected=true]:bg-primary/10"
		>
			<GridListCell>
				<SelectionCheckbox label={title} />
			</GridListCell>
			<GridListRowHeader>{title}</GridListRowHeader>
			<GridListCell className="text-sm text-muted-foreground">
				Ordinary row
			</GridListCell>
		</GridListRow>
	);
}

export default function StackedRowsExample() {
	const [open, setOpen] = useState(false);
	const toggle = () => setOpen((current) => !current);
	const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "Enter" || event.target !== event.currentTarget) return;
		event.preventDefault();
		toggle();
	};

	return (
		<GridListContainer
			selectionMode="multiple"
			name="stack-selection"
			aria-label="Stacked rows"
		>
			<GridListTitle className="p-2">Headless row behavior</GridListTitle>
			<GridListCaption className="px-2 pb-2">
				Shift-click the first and last checkbox to select through the collapsed
				stack. Enter toggles the focused summary row.
			</GridListCaption>
			<GridListContent gridClassName="grid-cols-[auto_minmax(0,1fr)_auto] rounded-lg bg-white">
				<GridHeader className="border-b p-2 text-sm font-medium">
					<GridListRow>
						<GridListColumnHeader>Select</GridListColumnHeader>
						<GridListColumnHeader>Title</GridListColumnHeader>
						<GridListColumnHeader>Kind</GridListColumnHeader>
					</GridListRow>
				</GridHeader>
				<GridBody className="divide-y">
					<DataRow rowId="before-stack" title="Before stack" />
					<GridListRow
						rowId="stack-summary"
						selectionIds={STACK_IDS}
						readOnly
						onKeyDown={handleSummaryKeyDown}
						className="items-center gap-3 rounded-sm bg-muted/40 p-2"
					>
						<GridListCell>
							<SelectionCheckbox
								label="both rows in this stack"
								onCheckedChange={(checked) => {
									if (checked) setOpen(true);
								}}
							/>
						</GridListCell>
						<GridListRowHeader className="flex items-center gap-2">
							<Layers3 aria-hidden className="size-4" />
							Two-row stack
						</GridListRowHeader>
						<GridListCell className="flex items-center justify-end gap-2">
							<span className="text-sm text-muted-foreground">
								Composite row
							</span>
							<button
								type="button"
								aria-expanded={open}
								aria-label={open ? "Collapse row stack" : "Expand row stack"}
								onClick={toggle}
								className="rounded-sm p-1 focus-visible:outline-2 focus-visible:outline-primary"
							>
								{open ? (
									<ChevronUp aria-hidden className="size-4" />
								) : (
									<ChevronDown aria-hidden className="size-4" />
								)}
							</button>
						</GridListCell>
					</GridListRow>
					{open ? (
						<>
							<DataRow rowId={STACK_IDS[0]} title="Stack detail A" />
							<DataRow rowId={STACK_IDS[1]} title="Stack detail B" />
						</>
					) : null}
					<DataRow rowId="after-stack" title="After stack" />
				</GridBody>
			</GridListContent>
		</GridListContainer>
	);
}
