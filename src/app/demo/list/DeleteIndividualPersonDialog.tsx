import {
  InteractiveForm,
  LoadingMessage,
  SubmitButton,
  SubmitMessage,
  Success,
} from "@/components/behaviors/interactive-form";
import { DialogClose } from "@/components/ui/dialog";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GridCurrentFocusFormField } from "@/components/ui/grid-list";
import { deletePersonById } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { AutoCloseDialog } from "./PeopleListDialog";
import { revalidatePath } from "next/cache";

export default function DeleteIndividualPersonDialog() {
  return (
    <InteractiveForm
      className="contents"
      action={async (formData) => {
        "use server";
        const selected = formData.get("deleting-id") as string;
        const deleteResult = await deletePersonById(selected);

        return deleteResult
          .map((ok) => {
            if (ok) {
              revalidatePath("/interactive-form-in-list");
              return { refresh: true, result: "success" };
            }

            // no one is deleted, no need to refresh
            return { result: "success" };
          })
          .getOrElse((err) => {
            switch (err.code) {
              case "missing_id":
                return { errors: { "deleting-id": ["valueMissing"] } };
              case "database_error":
                return { errors: { $: ["databaseError"] } };
            }
          });
      }}
    >
      <DialogHeader>
        <DialogTitle>Delete person?</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this person?
        </DialogDescription>

        <GridCurrentFocusFormField name="deleting-id" />

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
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
              <ReserveLayout>
                <LoadingMessage>Deleting...</LoadingMessage>
                <SubmitMessage>Delete person</SubmitMessage>
              </ReserveLayout>
            </Button>
          </SubmitButton>
        </DialogFooter>
      </DialogHeader>
    </InteractiveForm>
  );
}
