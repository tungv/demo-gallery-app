import {
  GridBody,
  GridListColumnHeader,
  GridHeader,
  GridListRow,
  GridListRowHeader,
  GridListCaption,
  GridListCell,
  GridFooter,
  GridListItemIndeterminateIndicator,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListTitle,
  GridListContent,
  GridListContainer,
} from "@/components/ui/grid-list";

import {
  CheckSquare2,
  MinusSquare,
  Square,
  Trash2,
  Edit3,
  ThumbsUp,
  Plus,
} from "lucide-react";
import NonEmptySelection from "./non-empty-selection";
import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { getPeople } from "./query";
import AddPersonDialog from "./AddPersonDialog";
import {
  InteractiveForm,
  LoadingMessage,
  SubmitMessage,
  ActionButton,
} from "@/components/behaviors/interactive-form";
import { deletePerson, incrementVoteCount } from "./actions";
import {
  PeopleListDialog,
  PeopleListDialogContent,
  PeopleListDialogProvider,
  PeopleListDialogTrigger,
} from "./PeopleListDialog";
import DeleteIndividualPersonDialog from "./DeleteIndividualPersonDialog";
import EditIndividualPersonDialog from "./EditIndividualPersonDialog";
import DeleteMultiplePeopleDialog from "./DeleteMultiplePeopleDialog";
import { Suspense } from "react";
import { countAllPeople } from "./data-store";

export const dynamic = "force-dynamic";

export default async function InteractiveFormInList() {
  const count = await countAllPeople();

  return (
    <div className="bg-muted grid grid-cols-1 auto-rows-min gap-12 p-12 h-dvh">
      <InteractiveForm className="contents">
        <PeopleListDialogProvider>
          <GridListContainer
            selectionMode="multiple"
            name="people-list"
            className="@container bg-white rounded-lg grid grid-cols-1 h-min gap-8 p-4 min-w-2xl"
            cycleRowFocus
          >
            <header className="grid grid-cols-[1fr_auto]">
              <GridListTitle>People</GridListTitle>
              <GridListCaption className="text-sm text-muted-foreground">
                {count} people
              </GridListCaption>
              <PeopleListDialogTrigger dialog="add-person" asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 col-start-2 row-start-1"
                >
                  <Plus className="size-4" />
                  Add person
                </Button>
              </PeopleListDialogTrigger>
            </header>

            <Suspense
              fallback={<FallbackGridContent size={Math.min(count, 10)} />}
            >
              <PeopleList />
            </Suspense>

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
          </GridListContainer>
        </PeopleListDialogProvider>
      </InteractiveForm>
    </div>
  );
}

function PeopleHeaderCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GridListColumnHeader
      className={`px-1 py-px text-sm text-muted-foreground text-center ${className}`}
    >
      {children}
    </GridListColumnHeader>
  );
}

function CheckBox({
  selectLabel,
  deselectLabel,
}: {
  selectLabel: string;
  deselectLabel: string;
}) {
  return (
    <GridListItemIndicatorRoot
      className="flex place-items-center"
      selectLabel={selectLabel}
      deselectLabel={deselectLabel}
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

function PeopleHeader() {
  return (
    <GridHeader>
      <GridListRow className="p-2">
        <PeopleHeaderCell>
          <CheckBox
            selectLabel="Select all people"
            deselectLabel="Deselect all people"
          />
        </PeopleHeaderCell>
        <PeopleHeaderCell>Name</PeopleHeaderCell>
        <PeopleHeaderCell className="@3xl:table-cell hidden">
          Email
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@4xl:table-cell hidden">
          Phone
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@5xl:table-cell hidden">
          Zip
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@6xl:table-cell hidden">
          Address
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@7xl:table-cell hidden">
          City
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@7xl:table-cell hidden">
          State
        </PeopleHeaderCell>
        <PeopleHeaderCell className="@2xl:table-cell hidden">
          Votes
        </PeopleHeaderCell>
        <PeopleHeaderCell>Actions</PeopleHeaderCell>
      </GridListRow>
    </GridHeader>
  );
}

async function PeopleList() {
  const people = await getPeople();

  return (
    <GridListContent className="@container grid-cols-[auto_1fr_auto] @2xl:grid-cols-[auto_1fr_auto_auto] @3xl:grid-cols-[auto_1fr_auto_auto_auto] @4xl:grid-cols-[auto_1fr_auto_auto_auto_auto] @5xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] @6xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] @7xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto_auto] h-fit border shadow-md rounded-sm min-w-2xl">
      <PeopleHeader />
      <GridBody className="divide-y border-y">
        {people.map((person) => (
          <GridListRow
            key={person.id}
            className="items-center gap-x-4 gap-y-1 focus-visible:outline-2 outline-primary rounded-sm focus-within:bg-secondary hover:bg-accent group px-2 py-1 hover:shadow-sm"
            rowId={person.id}
            rowData={person}
          >
            <GridListCell className="p-1">
              <CheckBox
                selectLabel={`Select ${person.name}`}
                deselectLabel={`Deselect ${person.name}`}
              />
            </GridListCell>
            <GridListRowHeader className="font-medium text-left px-1">
              {person.name}
            </GridListRowHeader>
            <GridListCell
              className="
              col-start-2 row-start-2 px-1 pb-1
              @3xl:col-start-3 @3xl:row-start-1 @3xl:px-1
              
              text-xs text-muted-foreground
              @3xl:text-base @3xl:text-foreground
              "
            >
              <span className="select-all">{person.email}</span>
            </GridListCell>
            <GridListCell className="@4xl:flex hidden px-1 tabular-nums">
              <span className="select-all">{person.phone}</span>
            </GridListCell>
            <GridListCell className="@5xl:flex hidden px-1 tabular-nums">
              <span className="select-all">{person.zip}</span>
            </GridListCell>
            <GridListCell className="@6xl:flex hidden px-1">
              {person.address}
            </GridListCell>
            <GridListCell className="@7xl:flex hidden px-1">
              {person.city}
            </GridListCell>
            <GridListCell className="@7xl:flex hidden px-1">
              {person.state}
            </GridListCell>
            <GridListCell className="@2xl:flex hidden px-1 text-center tabular-nums row-span-2 @3xl:row-span-1">
              {person.voteCount}
            </GridListCell>
            <GridListCell className="px-1 row-span-2 @3xl:row-span-1">
              <ActionsCell />
            </GridListCell>
          </GridListRow>
        ))}
      </GridBody>

      <NonEmptySelection minSize={2}>
        <GridFooter>
          <GridListRow className="p-2 gap-4 flex flex-row">
            <PeopleListDialogTrigger dialog="delete-multiple-people" asChild>
              <Button variant="destructive" size="sm" type="button">
                <Trash2 className="size-4" />
                <ReserveLayout>
                  <LoadingMessage>Deleting...</LoadingMessage>
                  <SubmitMessage>Delete multiple</SubmitMessage>
                </ReserveLayout>
              </Button>
            </PeopleListDialogTrigger>
          </GridListRow>
        </GridFooter>
      </NonEmptySelection>
    </GridListContent>
  );
}

function FallbackGridContent({ size }: { size: number }) {
  return (
    <GridListContent className="@container grid-cols-[auto_1fr_auto] @2xl:grid-cols-[auto_1fr_auto_auto] @3xl:grid-cols-[auto_1fr_auto_auto_auto] @4xl:grid-cols-[auto_1fr_auto_auto_auto_auto] @5xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] @6xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] @7xl:grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto_auto] h-fit border shadow-md rounded-sm py-1">
      <PeopleHeader />
      <GridBody className="divide-y border-y">
        {Array.from({ length: size }).map((_, index) => (
          <GridListRow
            inert
            // biome-ignore lint/suspicious/noArrayIndexKey: there is no data
            key={index}
            className="items-center gap-x-4 gap-y-1 focus-visible:outline-2 outline-primary rounded-sm focus-within:bg-secondary hover:bg-accent group px-2 hover:shadow-sm"
          >
            <GridListCell className="p-1">
              <CheckBox selectLabel="Select" deselectLabel="Deselect" />
            </GridListCell>
            <GridListRowHeader className="font-medium text-left px-1">
              {/* name */}
              <Skeleton length={10} />
            </GridListRowHeader>
            <GridListCell
              className="
              col-start-2 row-start-2 px-1 pb-1
              @3xl:col-start-4 @3xl:row-start-1 @3xl:px-1
              
              text-xs text-muted-foreground 
              @3xl:text-base @3xl:text-foreground
              "
            >
              {/* email */}
              <Skeleton length={20} />
            </GridListCell>
            <GridListCell className="@4xl:table-cell hidden px-1 tabular-nums">
              {/* phone */}
              <Skeleton length={10} />
            </GridListCell>
            <GridListCell className="@5xl:table-cell hidden px-1 tabular-nums">
              {/* zip */}
              <Skeleton length={5} />
            </GridListCell>
            <GridListCell className="@6xl:table-cell hidden px-1">
              {/* address */}
              <Skeleton length={10} />
            </GridListCell>
            <GridListCell className="@7xl:table-cell hidden px-1">
              {/* city */}
              <Skeleton length={10} />
            </GridListCell>
            <GridListCell className="@7xl:table-cell hidden px-1">
              {/* state */}
              <Skeleton length={2} />
            </GridListCell>
            <GridListCell className="@2xl:table-cell hidden px-1 text-center tabular-nums">
              {/* votes */}
              <Skeleton length={2} />
            </GridListCell>
            <GridListCell className="px-1 row-span-2 @3xl:row-span-1">
              {/* actions */}
              <ActionsCell />
            </GridListCell>
          </GridListRow>
        ))}
      </GridBody>
    </GridListContent>
  );
}

function Skeleton({ length = 10 }: { length?: number }) {
  return (
    <div className="animate-pulse bg-muted rounded-sm w-min">
      <span className="select-all text-transparent truncate">
        {Array.from({ length }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <span key={index}>W</span>
        ))}
      </span>
    </div>
  );
}
