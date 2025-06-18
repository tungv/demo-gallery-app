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
import { CheckSquare2, MinusSquare, Square, Trash2 } from "lucide-react";
import NonEmptySelection from "./non-empty-selection";
import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { getPeople } from "./query";
import AddPersonDialog from "./AddPersonDialog";
import { FormBoundary } from "@/components/behaviors/interactive-form";
import { deletePeopleByIds } from "./actions";
import { revalidatePath } from "next/cache";

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
      <Form className="contents">
        <GridListRoot
          className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto] h-fit"
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
            </GridListRow>
          </GridListHeader>
          <GridListBody className="divide-y border-y">
            {people.map((person) => (
              <GridListRow
                key={person.id}
                className="items-center gap-4"
                rowId={person.id}
              >
                <GridListCell className="p-1">
                  <CheckBox />
                </GridListCell>
                <GridListRowHeader className="font-medium text-left p-1">
                  {person.name}
                </GridListRowHeader>
                <GridListCell className="p-1">{person.email}</GridListCell>
                <GridListCell className="p-1 tabular-nums">
                  {person.phone}
                </GridListCell>
                <GridListCell className="p-1">{person.address}</GridListCell>
                <GridListCell className="p-1">{person.city}</GridListCell>
                <GridListCell className="p-1">{person.state}</GridListCell>
                <GridListCell className="p-1 tabular-nums">
                  {person.zip}
                </GridListCell>
              </GridListRow>
            ))}
          </GridListBody>

          <GridListFooter>
            <GridListRow className="p-2 gap-4 flex flex-row">
              {/* FormBoundary is here to ensure the form is reset after a successful submission */}
              <FormBoundary>
                <AddPersonDialog />
              </FormBoundary>
              <NonEmptySelection minSize={2}>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  formAction={async (formData) => {
                    "use server";
                    const selected = formData.getAll("people-list") as string[];
                    await deletePeopleByIds(selected);
                    revalidatePath("/interactive-form-in-list");
                  }}
                >
                  <Trash2 className="size-4" />
                  <ReserveLayout>
                    <FormPendingMessage>Deleting...</FormPendingMessage>
                    <FormSubmitMessage>Delete multiple</FormSubmitMessage>
                  </ReserveLayout>
                </Button>
              </NonEmptySelection>
            </GridListRow>
          </GridListFooter>
        </GridListRoot>
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
