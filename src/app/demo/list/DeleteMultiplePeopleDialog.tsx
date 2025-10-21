import {
  InteractiveForm,
  LoadingMessage,
  SubmitButton,
  SubmitMessage,
  Success,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { Trash2 } from "lucide-react";
import SelectedPeopleNameList from "./SelectedPeopleNameList";
import { deletePeopleByIds } from "./actions";
import { GridCurrentSelectedRowsFormField } from "@/components/ui/grid-list";
import { AutoCloseDialog } from "./PeopleListDialog";
import { revalidatePath } from "next/cache";

export default function DeleteMultiplePeopleDialog() {
  return (
    <InteractiveForm
      className="contents"
      action={async (formData) => {
        "use server";
        const selected = formData.getAll("deleting-id-array") as string[];
        const deleteResult = await deletePeopleByIds(selected);

        return deleteResult
          .map((deletedCount) => {
            if (deletedCount > 0) {
              revalidatePath("/demo/list");
              return { refresh: true, result: "success" };
            }

            // no one was deleted
            return { result: "success" };
          })
          .getOrElse((err) => {
            return { errors: { $: ["databaseError"] } };
          });
      }}
    >
      <DialogHeader>
        <DialogTitle>Delete multiple people</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the selected people?
        </DialogDescription>
      </DialogHeader>

      <p>People to delete:</p>
      <SelectedPeopleNameList />

      <GridCurrentSelectedRowsFormField name="deleting-id-array" />
      <Success>
        <AutoCloseDialog />
      </Success>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </DialogClose>

        <SubmitButton asChild>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="size-4" />
            <ReserveLayout>
              <LoadingMessage>Deleting...</LoadingMessage>
              <SubmitMessage>Delete multiple</SubmitMessage>
            </ReserveLayout>
          </Button>
        </SubmitButton>
      </DialogFooter>
    </InteractiveForm>
  );
}
