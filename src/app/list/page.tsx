import { Button } from "@/components/ui/button";
import { Form, FormSubmit } from "@/components/ui/form";
import {
	GridBody,
	GridFooter,
	GridHeader,
	GridListCaption,
	GridListCell,
	GridListColumnHeader,
	GridListContainer,
	GridListContent,
	GridListDebugger,
	GridListItemIndeterminateIndicator,
	GridListItemIndicatorRoot,
	GridListItemSelectedIndicator,
	GridListItemUnselectedIndicator,
	GridListRow,
	GridListRowHeader,
	GridListTitle,
} from "@/components/ui/grid-list";
import { cn } from "@/lib/utils";
import {
	CheckSquare2,
	MinusSquareIcon,
	PlusIcon,
	Square,
	TrashIcon,
} from "lucide-react";
import ActionRow from "./ActionRow";

export default function ListPage() {
	return (
		<div className="bg-muted grid grid-cols-1 gap-12 p-12 h-dvh">
			<Form
				className="contents"
				action={async (formData) => {
					"use server";
					console.log(formData.getAll("multiple-selection"));
				}}
			>
				<div>
					<GridListContainer
						selectionMode="multiple"
						name="multiple-selection"
						initialValue={["4", "6"]}
						required
					>
						<GridListTitle className="p-2">
							Multiple Selection Example
						</GridListTitle>
						<GridListCaption className="px-2 pb-2">
							Select multiple rows using checkboxes or spacebar. Header checkbox
							selects/deselects all.
						</GridListCaption>
						<GridListContent gridClassName="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit">
							<GridHeader className="p-1 gap-x-8">
								<GridListRow>
									<GridListColumnHeader className="text-sm font-medium px-1">
										<SelectionCheckbox />
									</GridListColumnHeader>
									<GridListColumnHeader className="text-sm font-medium">
										Title
									</GridListColumnHeader>
									<GridListColumnHeader
										className="text-sm font-medium"
										sortDirection="ascending"
										sortable
									>
										Amount
									</GridListColumnHeader>
									<GridListColumnHeader className="text-sm font-medium">
										Actions
									</GridListColumnHeader>
								</GridListRow>
							</GridHeader>
							<GridBody className="divide-y border-y">
								<GridListRow
									rowId="4"
									className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
								>
									<GridListCell className="p-1">
										<SelectionCheckbox />
									</GridListCell>
									<GridListRowHeader>Row 1 Title</GridListRowHeader>
									<GridListCell className="p-1 tabular-nums">
										10,000,000
									</GridListCell>
									<GridListCell>
										<ActionButtons />
									</GridListCell>
								</GridListRow>
								<GridListRow
									rowId="5"
									className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
								>
									<GridListCell className="p-1">
										<SelectionCheckbox />
									</GridListCell>
									<GridListRowHeader>Row 2 Title</GridListRowHeader>
									<GridListCell className="p-1 tabular-nums">
										5,500,000
									</GridListCell>
									<GridListCell>
										<ActionButtons />
									</GridListCell>
								</GridListRow>
								<GridListRow
									rowId="6"
									className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
								>
									<GridListCell className="p-1">
										<SelectionCheckbox />
									</GridListCell>
									<GridListRowHeader>Row 3 Title</GridListRowHeader>
									<GridListCell className="p-1 tabular-nums">
										2,750,000
									</GridListCell>
									<GridListCell>
										<ActionButtons />
									</GridListCell>
								</GridListRow>
							</GridBody>
							<GridFooter>
								<ActionRow />
							</GridFooter>
							<GridFooter>
								<GridListDebugger />
							</GridFooter>
						</GridListContent>
						<FormSubmit asChild>
							<Button>Submit</Button>
						</FormSubmit>
					</GridListContainer>
				</div>
			</Form>

			<div>
				<GridListContainer
					selectionMode="multiple"
					name="disabled-readonly-example"
					initialValue={["8", "10"]}
				>
					<GridListTitle className="p-2">
						Disabled and Read-only Rows
					</GridListTitle>
					<GridListCaption className="px-2 pb-2">
						This example shows disabled and read-only rows. Try using spacebar
						to toggle selection on different row types.
					</GridListCaption>
					<GridListContent gridClassName="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit">
						<GridHeader className="p-1 gap-x-8">
							<GridListRow>
								<GridListColumnHeader className="text-sm font-medium px-1">
									<SelectionCheckbox />
								</GridListColumnHeader>
								<GridListColumnHeader className="text-sm font-medium">
									Title
								</GridListColumnHeader>
								<GridListColumnHeader className="text-sm font-medium">
									Amount
								</GridListColumnHeader>
								<GridListColumnHeader className="text-sm font-medium">
									Actions
								</GridListColumnHeader>
							</GridListRow>
						</GridHeader>
						<GridBody className="divide-y border-y">
							<GridListRow
								rowId="7"
								className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
							>
								<GridListCell className="p-1">
									<SelectionCheckbox />
								</GridListCell>
								<GridListRowHeader className="p-1 font-medium">
									Normal row
								</GridListRowHeader>
								<GridListCell className="p-1 tabular-nums">
									10,000,000
								</GridListCell>
								<GridListCell>
									<ActionButtons />
								</GridListCell>
							</GridListRow>
							<GridListRow
								rowId="8"
								readOnly
								className={cn(
									"items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md",
									"bg-gray-50",
								)}
							>
								<GridListCell className="p-1">
									<SelectionCheckbox />
								</GridListCell>
								<GridListRowHeader className="p-1 font-medium">
									Read-only row
								</GridListRowHeader>
								<GridListCell className="p-1 tabular-nums">
									7,500,000
								</GridListCell>
								<GridListCell>
									<ActionButtons />
								</GridListCell>
							</GridListRow>
							<GridListRow
								rowId="9"
								disabled
								className={cn(
									"items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md",
									"opacity-50 cursor-not-allowed",
								)}
							>
								<GridListCell className="p-1">
									<SelectionCheckbox />
								</GridListCell>
								<GridListRowHeader className="p-1 font-medium">
									Disabled row
								</GridListRowHeader>
								<GridListCell className="p-1 tabular-nums">
									3,250,000
								</GridListCell>
								<GridListCell>
									<ActionButtons disabled />
								</GridListCell>
							</GridListRow>
							<GridListRow
								rowId="10"
								className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
							>
								<GridListCell className="p-1">
									<SelectionCheckbox />
								</GridListCell>
								<GridListRowHeader className="p-1 font-medium">
									Another normal row
								</GridListRowHeader>
								<GridListCell className="p-1 tabular-nums">
									12,750,000
								</GridListCell>
								<GridListCell>
									<ActionButtons />
								</GridListCell>
							</GridListRow>
						</GridBody>
						<GridFooter>
							<GridListDebugger />
						</GridFooter>
					</GridListContent>
				</GridListContainer>
			</div>
		</div>
	);
}

function SelectionCheckbox() {
	return (
		<GridListItemIndicatorRoot>
			<GridListItemSelectedIndicator>
				<CheckSquare2 />
			</GridListItemSelectedIndicator>
			<GridListItemUnselectedIndicator>
				<Square />
			</GridListItemUnselectedIndicator>
			<GridListItemIndeterminateIndicator>
				<MinusSquareIcon />
			</GridListItemIndeterminateIndicator>
		</GridListItemIndicatorRoot>
	);
}

function ActionButtons({ disabled = false }: { disabled?: boolean }) {
	return (
		<div className="flex gap-x-2 items-center">
			<Button
				className="focus-visible:outline-2 outline-primary"
				disabled={disabled}
			>
				<PlusIcon />
				<span>Add</span>
			</Button>
			<Button
				variant="destructive"
				className="focus-visible:outline-2 outline-primary"
				disabled={disabled}
			>
				<TrashIcon />
				<span>Remove</span>
			</Button>
		</div>
	);
}
