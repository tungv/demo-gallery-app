import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormField, FormLabel, InputControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default function CreateAlbumButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          Create Album
        </Button>
      </DialogTrigger>

      <DialogContent>
        <Form
          action={async (formData) => {
            "use server";

            const title = formData.get("title") as string;

            if (!title) {
              throw new Error("Title is required");
            }

            redirect("/creator/albums");
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
            <DialogDescription>
              Create a new album to store your images.
            </DialogDescription>
          </DialogHeader>

          <FormField name="title">
            <FormLabel>Title</FormLabel>
            <InputControl asChild>
              <Input required placeholder="Enter album title..." />
            </InputControl>
          </FormField>

          <DialogFooter>
            <Button>Create</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
