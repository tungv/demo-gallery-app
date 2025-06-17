"use client";

import { Button } from "@/components/ui/button";
import {
  Debugger,
  GridListBody,
  GridListFooter,
  GridListHeader,
  GridListItemIndeterminateIndicator,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListRoot,
  GridListRow,
} from "@/components/ui/grid-list";
import {
  CheckSquare2,
  MinusSquareIcon,
  PlusIcon,
  Square,
  TrashIcon,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { useState } from "react";

export default function ControlledListPage() {
  const [value, setValue] = useState<string[]>(["1", "2", "3"]);

  function shuffle() {
    const newList = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    setValue(
      newList
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1),
    );
  }

  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12 h-fit">
      <h1>Controlled List</h1>

      <Button onClick={shuffle}>Shuffle</Button>

      <GridListRoot
        selectionMode="multiple"
        className="bg-white p-2 rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit"
        value={value}
        onValueChange={(newValue) => setValue(newValue)}
      >
        <GridListHeader>
          <div className="text-sm font-medium px-1">
            <CustomCheckbox />
          </div>
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>

        <GridListBody>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((rowId) => (
            <GridListRow key={rowId} rowId={rowId} asChild>
              <MyRow />
            </GridListRow>
          ))}
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>

      <div>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
}

function CustomCheckbox() {
  return (
    <GridListItemIndicatorRoot>
      <GridListItemSelectedIndicator>
        <CheckSquare2 />
      </GridListItemSelectedIndicator>
      <GridListItemUnselectedIndicator>
        <Square />
      </GridListItemUnselectedIndicator>
      <GridListItemIndeterminateIndicator>
        <MinusSquareIcon />
      </GridListItemIndeterminateIndicator>
    </GridListItemIndicatorRoot>
  );
}

function MyRow(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md"
      {...props}
    >
      <div className="p-1">
        <CustomCheckbox />
      </div>

      <h3 className="p-1 font-medium">row title</h3>

      <span className="p-1 tabular-nums">10,000,000</span>

      <div className="flex gap-x-2 items-center">
        <Button className="focus-visible:outline-2 outline-primary">
          <PlusIcon />
          <span>Add</span>
        </Button>

        <Button
          variant="destructive"
          className="focus-visible:outline-2 outline-primary"
        >
          <TrashIcon />
          <span>Remove</span>
        </Button>
      </div>
    </div>
  );
}
