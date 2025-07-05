"use client";

import { useFocusedRowData } from "@/components/ui/grid-list";
import { Input } from "@/components/ui/input";

import type { Person } from "./data-store";

export default function EditPersonFormInput({
  dataKeyName,
  ...inputProps
}: {
  dataKeyName: keyof Person;
} & React.ComponentProps<typeof Input>) {
  const data = useFocusedRowData<Person>();

  if (data == null) {
    return <Input {...inputProps} />;
  }

  const initialValue =
    dataKeyName in data ? (data[dataKeyName] as string) : undefined;

  return <Input {...inputProps} defaultValue={initialValue} />;
}
