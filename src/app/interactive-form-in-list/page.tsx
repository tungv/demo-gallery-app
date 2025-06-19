import {
  Form,
  FormPendingMessage,
  FormSubmitMessage,
} from "@/components/ui/form";
import {
  GridListBody,
  GridListColumnHeader,
  GridListHeader,
  GridListRoot,
  GridListRow,
  GridListRowHeader,
} from "@/components/ui/grid-list";
import {
  GridListCaption,
  GridListCell,
  GridListFooter,
  GridListItemIndeterminateIndicator,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListTitle,
} from "@/components/ui/grid-list/components";
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
import { Debugger } from "@/components/ui/grid-list/debug";

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
          <GridListRoot
            className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto_auto] h-fit"
            selectionMode="multiple"
            name="people-list"
          >
            <GridListTitle className="p-2">People</GridListTitle>
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
                  <GridListCell className="p-1">{person.address}</GridListCell>
                  <GridListCell className="p-1">{person.city}</GridListCell>
                  <GridListCell className="p-1">{person.state}</GridListCell>
                  <GridListCell className="p-1 tabular-nums">
                    <span className="select-all">{person.zip}</span>
                  </GridListCell>
                  <GridListCell className="p-1">
                    <ActionsCell personId={person.id} />
                  </GridListCell>
                </GridListRow>
              ))}
            </GridListBody>

            <GridListFooter>
              <Debugger />

              <GridListRow className="p-2 gap-4 flex flex-row">
                {/* FormBoundary is here to ensure the form is reset after a successful submission */}
                <FormBoundary>
                  <AddPersonDialog />
                </FormBoundary>
                <NonEmptySelection minSize={2}>
                  <ActionButton<"people-list">
                    asChild
                    formAction={async (formData) => {
                      "use server";
                      const selected = formData.getAll(
                        "people-list",
                      ) as string[];
                      await deletePeopleByIds(selected);
                      // revalidatePath("/interactive-form-in-list");
                      return {
                        refresh: true,
                      };
                    }}
                  >
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="size-4" />
                      <ReserveLayout>
                        <LoadingMessage>Deleting...</LoadingMessage>
                        <SubmitMessage>Delete multiple</SubmitMessage>
                      </ReserveLayout>
                    </Button>
                  </ActionButton>
                </NonEmptySelection>
              </GridListRow>
            </GridListFooter>
          </GridListRoot>
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

function ActionsCell({ personId }: { personId: string }) {
  return (
    <div className="flex items-center bg-white/90 rounded-md focus-within:shadow-sm">
      <Button type="button" variant="ghost" title="Edit person">
        <Edit3 className="size-4 text-muted-foreground hover:text-foreground" />
      </Button>

      <Button type="button" variant="ghost" title="Flag person">
        <Flag className="size-4 text-muted-foreground hover:text-foreground" />
      </Button>

      <ActionButton<"people-list.focused">
        asChild
        formAction={async (formData) => {
          "use server";
          const selected = formData.get("people-list.focused") as string;
          await deletePersonById(selected);
          return { refresh: true };
        }}
      >
        <Button type="button" variant="ghost" title="Delete person">
          <Trash2 className="size-4 text-destructive hover:text-destructive/80" />
        </Button>
      </ActionButton>
    </div>
  );
}
