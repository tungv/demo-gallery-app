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
import { GridCurrentFocusInput } from "@/components/ui/grid-list";
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
        await deletePersonById(selected);
        revalidatePath("/interactive-form-in-list");
        return { refresh: true };
      }}
    >
      <DialogHeader>
        <DialogTitle>Delete person?</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this person?
        </DialogDescription>

        <GridCurrentFocusInput name="deleting-id" />

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
