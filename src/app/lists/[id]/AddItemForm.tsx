"use client";

import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormLabel,
  InputControl,
  FormMessage,
  FormSubmit,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import type { Shop } from "@/lib/types";
import { addItemAction } from "./actions";

interface AddItemFormProps {
  listId: string;
  shops: Shop[];
}

export default function AddItemForm({ listId, shops }: AddItemFormProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>("");

  const shopOptions = shops.map(shop => ({
    value: shop.name,
    label: shop.name,
  }));

  return (
    <Form action={addItemAction} className="space-y-4">
      <input type="hidden" name="listId" value={listId} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="name">
          <FormLabel>Item Name</FormLabel>
          <InputControl asChild>
            <Input
              type="text"
              placeholder="Milk, Bread, etc."
              required
              autoComplete="off"
            />
          </InputControl>
          <FormMessage match="valueMissing">Item name is required</FormMessage>
        </FormField>

        <FormField name="shop">
          <FormLabel>Shop (Optional)</FormLabel>
          <Combobox
            value={selectedShop}
            onValueChange={setSelectedShop}
            options={shopOptions}
            placeholder="Select or type shop..."
            searchPlaceholder="Search shops..."
            emptyText="Type to add new shop"
          />
          <input type="hidden" name="shop" value={selectedShop} />
        </FormField>
      </div>

      {showNotes && (
        <FormField name="notes">
          <FormLabel>Notes</FormLabel>
          <InputControl asChild>
            <Input
              type="text"
              placeholder="Brand preference, quantity, etc."
              autoComplete="off"
            />
          </InputControl>
        </FormField>
      )}

      <div className="flex gap-2">
        <FormSubmit asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </FormSubmit>
        
        {!showNotes && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNotes(true)}
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>
    </Form>
  );
}