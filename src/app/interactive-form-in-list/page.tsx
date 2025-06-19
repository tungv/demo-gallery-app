import { Form } from "@/components/ui/form";
import {
  GridListBody,
  GridListColumnHeader,
  GridListHeader,
  GridListRoot,
  GridListRow,
  GridListRowHeader,
  GridListCaption,
  GridListCell,
  GridListFooter,
  GridListItemIndeterminateIndicator,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListTitle,
  GridListDebugger,
} from "@/components/ui/grid-list";

import {
  CheckSquare2,
  MinusSquare,
  Square,
  Trash2,
  Edit3,
  Flag,
} from "lucide-react";
import NonEmptySelection from "./non-empty-selection";
import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { getPeople } from "./query";
import AddPersonDialog from "./AddPersonDialog";
import {
  ActionButton,
  FormBoundary,
  InteractiveForm,
  LoadingMessage,
  SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { deletePeopleByIds, deletePersonById } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose, DialogDescription } from "@radix-ui/react-dialog";
import SelectedPeopleNameList from "./SelectedPeopleNameList";
import {
  PeopleListDialog,
  PeopleListDialogContent,
  PeopleListDialogProvider,
  PeopleListDialogTrigger,
} from "./state";

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default async function InteractiveFormInList() {
  const people = await getPeople();
  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12 h-dvh">
      <Form className="contents" asChild>
        <InteractiveForm>
          <PeopleListDialogProvider>
            <GridListRoot
              className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto] h-fit"
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
                        <GridListCell className="p-1">
                          {person.city}
                        </GridListCell>
                        <GridListCell className="p-1">
                          {person.state}
                        </GridListCell>
                        <GridListCell className="p-1 tabular-nums">
                          <span className="select-all">{person.zip}</span>
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
                    <AddPersonDialog />
                  </FormBoundary>
                  <NonEmptySelection minSize={2}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" type="button">
                          <Trash2 className="size-4" />
                          <ReserveLayout>
                            <LoadingMessage>Deleting...</LoadingMessage>
                            <SubmitMessage>Delete multiple</SubmitMessage>
                          </ReserveLayout>
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete multiple people</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                          Are you sure you want to delete the selected people?
                        </DialogDescription>

                        <p>People to delete:</p>
                        <SelectedPeopleNameList />

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" size="sm">
                              Cancel
                            </Button>
                          </DialogClose>

                          <ActionButton<"people-list">
                            asChild
                            formAction={async (formData) => {
                              "use server";
                              const selected = formData.getAll(
                                "people-list",
                              ) as string[];
                              await deletePeopleByIds(selected);
                              return {
                                refresh: true,
                              };
                            }}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                            >
                              <Trash2 className="size-4" />
                              <ReserveLayout>
                                <LoadingMessage>Deleting...</LoadingMessage>
                                <SubmitMessage>Delete multiple</SubmitMessage>
                              </ReserveLayout>
                            </Button>
                          </ActionButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </NonEmptySelection>
                </GridListRow>
              </GridListFooter>

              <PeopleListDialog>
                <PeopleListDialogContent when="delete-person">
                  <DialogHeader>
                    <DialogTitle>Delete person?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this person?
                    </DialogDescription>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </DialogClose>

                      <ActionButton<"people-list.focused">
                        asChild
                        formAction={async (formData) => {
                          "use server";
                          const selected = formData.get(
                            "people-list.focused",
                          ) as string;
                          await deletePersonById(selected);
                          return { refresh: true };
                        }}
                      >
                        <Button type="button" variant="destructive" size="sm">
                          <Trash2 className="size-4" />
                          <ReserveLayout>
                            <LoadingMessage>Deleting...</LoadingMessage>
                            <SubmitMessage>Delete person</SubmitMessage>
                          </ReserveLayout>
                        </Button>
                      </ActionButton>
                    </DialogFooter>
                  </DialogHeader>
                </PeopleListDialogContent>
              </PeopleListDialog>
            </GridListRoot>
          </PeopleListDialogProvider>
        </InteractiveForm>
      </Form>
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
      <Button type="button" variant="ghost" title="Edit person">
        <Edit3 className="size-4 text-muted-foreground hover:text-foreground" />
      </Button>

      <Button type="button" variant="ghost" title="Flag person">
        <Flag className="size-4 text-muted-foreground hover:text-foreground" />
      </Button>

      <PeopleListDialogTrigger dialog="delete-person" asChild>
        <Button type="button" variant="ghost" title="Delete person">
          <Trash2 className="size-4 text-destructive hover:text-destructive" />
        </Button>
      </PeopleListDialogTrigger>
    </div>
  );
}
