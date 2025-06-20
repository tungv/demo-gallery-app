import {
	GridListBody,
	GridListCaption,
	GridListCell,
	GridListColumnHeader,
	GridListFooter,
	GridListHeader,
	GridListItemIndeterminateIndicator,
	GridListItemIndicatorRoot,
	GridListItemSelectedIndicator,
	GridListItemUnselectedIndicator,
	GridListRoot,
	GridListRow,
	GridListRowHeader,
	GridListTitle,
} from "@/components/ui/grid-list";

import {
	ActionButton,
	FormBoundary,
	InteractiveForm,
	LoadingMessage,
	SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import {
	CheckSquare2,
	Edit3,
	MinusSquare,
	Plus,
	Square,
	ThumbsUp,
	Trash2,
} from "lucide-react";
import AddPersonDialog from "./AddPersonDialog";
import DeleteIndividualPersonDialog from "./DeleteIndividualPersonDialog";
import DeleteMultiplePeopleDialog from "./DeleteMultiplePeopleDialog";
import EditIndividualPersonDialog from "./EditIndividualPersonDialog";
import {
	PeopleListDialog,
	PeopleListDialogContent,
	PeopleListDialogProvider,
	PeopleListDialogTrigger,
} from "./PeopleListDialog";
import { incrementVoteCount } from "./actions";
import NonEmptySelection from "./non-empty-selection";
import { getPeople } from "./query";

export const dynamic = "force-dynamic";

export default async function InteractiveFormInList() {
	const people = await getPeople();
	return (
		<div className="bg-muted grid grid-cols-1 auto-rows-min gap-12 p-12 h-dvh">
			<InteractiveForm className="contents">
				<PeopleListDialogProvider>
					<GridListRoot
						className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto_auto] h-fit"
						selectionMode="multiple"
						name="people-list"
					>
						<GridListTitle className="p-2">People</GridListTitle>

						{people.length === 0 ? (
							<>
								<GridListCaption className="px-2 pb-2">
									This list is empty.
								</GridListCaption>
								<div className="p-12 text-center col-span-full bg-muted">
									<p className="text-muted-foreground italic">
										No people found.
									</p>
								</div>
							</>
						) : (
							<>
								<GridListCaption className="px-2 pb-2">
									Showing {people.length} people.
								</GridListCaption>
								<GridListHeader>
									<GridListRow>
										<PeopleHeaderCell>
											<CheckBox />
										</PeopleHeaderCell>
										<PeopleHeaderCell>Name</PeopleHeaderCell>
										<PeopleHeaderCell>Email</PeopleHeaderCell>
										<PeopleHeaderCell>Phone</PeopleHeaderCell>
										<PeopleHeaderCell>Address</PeopleHeaderCell>
										<PeopleHeaderCell>City</PeopleHeaderCell>
										<PeopleHeaderCell>State</PeopleHeaderCell>
										<PeopleHeaderCell>Zip</PeopleHeaderCell>
										<PeopleHeaderCell>Votes</PeopleHeaderCell>
										<PeopleHeaderCell>Actions</PeopleHeaderCell>
									</GridListRow>
								</GridListHeader>
								<GridListBody className="divide-y border-y">
									{people.map((person) => (
										<GridListRow
											key={person.id}
											className="items-center gap-4 focus-visible:outline-2 outline-primary rounded-md focus-within:bg-secondary hover:bg-accent group"
											rowId={person.id}
											rowData={person}
										>
											<GridListCell className="p-1">
												<CheckBox />
											</GridListCell>
											<GridListRowHeader className="font-medium text-left p-1">
												{person.name}
											</GridListRowHeader>
											<GridListCell className="p-1">
												<span className="select-all">{person.email}</span>
											</GridListCell>
											<GridListCell className="p-1 tabular-nums">
												<span className="select-all">{person.phone}</span>
											</GridListCell>
											<GridListCell className="p-1">
												{person.address}
											</GridListCell>
											<GridListCell className="p-1">{person.city}</GridListCell>
											<GridListCell className="p-1">
												{person.state}
											</GridListCell>
											<GridListCell className="p-1 tabular-nums">
												<span className="select-all">{person.zip}</span>
											</GridListCell>
											<GridListCell className="p-1 text-center tabular-nums">
												{person.voteCount}
											</GridListCell>
											<GridListCell className="p-1">
												<ActionsCell />
											</GridListCell>
										</GridListRow>
									))}
								</GridListBody>
							</>
						)}

						<GridListFooter>
							<GridListRow className="p-2 gap-4 flex flex-row">
								{/* FormBoundary is here to ensure the form is reset after a successful submission */}
								<FormBoundary>
									<PeopleListDialogTrigger dialog="add-person" asChild>
										<Button variant="outline" size="sm" className="gap-2">
											<Plus className="size-4" />
											Add person
										</Button>
									</PeopleListDialogTrigger>
								</FormBoundary>
								<NonEmptySelection minSize={2}>
									<PeopleListDialogTrigger
										dialog="delete-multiple-people"
										asChild
									>
										<Button variant="destructive" size="sm" type="button">
											<Trash2 className="size-4" />
											<ReserveLayout>
												<LoadingMessage>Deleting...</LoadingMessage>
												<SubmitMessage>Delete multiple</SubmitMessage>
											</ReserveLayout>
										</Button>
									</PeopleListDialogTrigger>
								</NonEmptySelection>
							</GridListRow>
						</GridListFooter>

						<PeopleListDialog>
							<PeopleListDialogContent
								when="add-person"
								className="max-h-[80vh] overflow-y-auto"
							>
								<AddPersonDialog />
							</PeopleListDialogContent>
							<PeopleListDialogContent when="delete-person">
								<DeleteIndividualPersonDialog />
							</PeopleListDialogContent>
							<PeopleListDialogContent when="edit-person">
								<EditIndividualPersonDialog />
							</PeopleListDialogContent>
							<PeopleListDialogContent when="delete-multiple-people">
								<DeleteMultiplePeopleDialog />
							</PeopleListDialogContent>
						</PeopleListDialog>
					</GridListRoot>
				</PeopleListDialogProvider>
			</InteractiveForm>
		</div>
	);
}

function PeopleHeaderCell({ children }: { children: React.ReactNode }) {
	return (
		<GridListColumnHeader className="px-1 py-px text-sm text-muted-foreground text-center">
			{children}
		</GridListColumnHeader>
	);
}

function CheckBox() {
	return (
		<GridListItemIndicatorRoot className="flex place-items-center">
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

function ActionsCell() {
	return (
		<div className="flex items-center bg-white/90 rounded-md focus-within:shadow-sm">
			<PeopleListDialogTrigger dialog="edit-person" asChild>
				<Button type="button" variant="ghost" title="Edit person">
					<Edit3 className="size-4 text-muted-foreground hover:text-foreground" />
				</Button>
			</PeopleListDialogTrigger>

			<ActionButton formAction={incrementVoteCount} asChild>
				<Button type="button" variant="ghost" title="Vote for person">
					<ThumbsUp className="size-4 text-muted-foreground hover:text-foreground" />
				</Button>
			</ActionButton>

			<PeopleListDialogTrigger dialog="delete-person" asChild>
				<Button type="button" variant="ghost" title="Delete person">
					<Trash2 className="size-4 text-destructive hover:text-destructive" />
				</Button>
			</PeopleListDialogTrigger>
		</div>
	);
}
