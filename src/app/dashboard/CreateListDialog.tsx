"use client";

import { Plus } from "lucide-react";
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
import {
  Form,
  FormField,
  FormLabel,
  InputControl,
  FormMessage,
  FormSubmit,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createListAction } from "./actions";

export default function CreateListDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new shopping list</DialogTitle>
          <DialogDescription>
            Give your shopping list a name to get started.
          </DialogDescription>
        </DialogHeader>
        <Form action={createListAction}>
          <FormField name="name">
            <FormLabel>List Name</FormLabel>
            <InputControl asChild>
              <Input
                type="text"
                placeholder="Groceries, Weekly Shopping, etc."
                required
                autoFocus
              />
            </InputControl>
            <FormMessage match="valueMissing">
              List name is required
            </FormMessage>
          </FormField>
          <DialogFooter className="mt-6">
            <FormSubmit asChild>
              <Button>Create List</Button>
            </FormSubmit>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}