import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Debugger,
  GridListBody,
  GridListCheckbox,
  GridListFooter,
  GridListHeader,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListItemIndeterminateIndicator,
  GridListRoot,
  GridListRow,
} from "@/components/ui/grid-list";
import {
  CheckCheckIcon,
  CheckIcon,
  CheckSquare,
  CheckSquare2,
  MinusSquareIcon,
  PlusIcon,
  Square,
  TrashIcon,
} from "lucide-react";

export default function ListPage() {
  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12 h-dvh">
      <GridListRoot className="bg-white p-2 rounded-lg grid-cols-[auto_1fr_auto]">
        <GridListHeader className="p-1 gap-x-8">
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>
        <GridListBody>
          <GridListRow asChild rowId="1">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="3">
            <CustomRow />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>

      <GridListRoot
        className="bg-white p-2 rounded-lg grid-cols-[auto_1fr_auto]"
        cycleRowFocus
      >
        <GridListHeader className="p-1 gap-x-8">
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>
        <GridListBody>
          <GridListRow asChild rowId="1">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="3">
            <CustomRow />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>

      <GridListRoot
        className="bg-white p-2 rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit"
        selectionMode="single"
        name="single-selection"
      >
        <GridListHeader>
          <h2 className="text-sm font-medium col-span-full">
            Single selection
          </h2>
        </GridListHeader>
        <GridListHeader className="p-1 gap-x-8">
          <div className="text-sm font-medium">Select</div>
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>
        <GridListBody>
          <GridListRow asChild rowId="1">
            <CustomRowWithTraditionalCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRowWithTraditionalCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="3">
            <CustomRowWithTraditionalCheckbox />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>

      <GridListRoot
        className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit"
        selectionMode="multiple"
        name="multiple-selection"
        required
      >
        <GridListHeader>
          <h2 className="text-sm font-medium col-span-full p-2">
            Multiple selection
          </h2>
        </GridListHeader>
        <GridListHeader className="p-1 gap-x-8">
          <div className="text-sm font-medium px-1">
            <CustomCheckbox />
          </div>
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>
        <GridListBody className="divide-y border-y">
          <GridListRow asChild rowId="4">
            <CustomRowWithCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="5">
            <CustomRowWithCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="6">
            <CustomRowWithCheckbox />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>
    </div>
  );
}

function CustomRow() {
  return (
    <div className="items-center focus-visible:outline-2 outline-primary rounded-md p-1 gap-x-8">
      <h2 className="p-1 font-medium">row title</h2>

      <span className="p-1 tabular-nums">10,000,000</span>

      <div className="flex gap-x-2 items-center">
        <Button>
          <PlusIcon />
          <span>Add</span>
        </Button>

        <Button variant="destructive">
          <TrashIcon />
          <span>Remove</span>
        </Button>
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

function CustomRowWithCheckbox() {
  return (
    <div className="items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md">
      <div className="p-1">
        <CustomCheckbox />
      </div>

      <h2 className="p-1 font-medium">row title</h2>

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

function CustomRowWithTraditionalCheckbox() {
  return (
    <div className="items-center focus-visible:outline-2 outline-primary rounded-md p-1 gap-x-8 data-[selected=true]:bg-primary/10">
      <div className="p-1">
        <GridListItemIndicatorRoot />
      </div>

      <h2 className="p-1 font-medium">row title</h2>

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
