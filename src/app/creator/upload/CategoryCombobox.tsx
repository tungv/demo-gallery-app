import { Check } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxIndicator,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTrigger,
  ComboboxValues,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";

// common 20 photo categories
const categories = [
  "Animal",
  "Architecture",
  "Art",
  "City",
  "Dance",
  "Event",
  "Fashion",
  "Food",
  "Landscape",
  "Macro",
  "Music",
  "Nature",
  "Night",
  "Portrait",
  "Product",
  "Sports",
  "Technology",
  "Travel",
];

export default function CategoryCombobox({ name }: { name?: string }) {
  return (
    <Combobox name={name} multiple required>
      <ComboboxTrigger asChild>
        <Button type="button" className="justify-start" variant="outline">
          <ComboboxValues placeholder={"Select Categories…"} />
        </Button>
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxInput placeholder="Search..." />
        <ComboboxOptions>
          {categories.map((category) => (
            <ComboboxOption key={category} value={category}>
              {category}
              <ComboboxIndicator>
                <Check />
              </ComboboxIndicator>
            </ComboboxOption>
          ))}

          <ComboboxEmpty>no match</ComboboxEmpty>
        </ComboboxOptions>
      </ComboboxContent>
    </Combobox>
  );
}
