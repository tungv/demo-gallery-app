import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Debugger,
  GridListBody,
  GridListCheckbox,
  GridListFooter,
  GridListHeader,
  GridListRoot,
  GridListRow,
} from "@/components/ui/grid-list";
import { PlusIcon, TrashIcon } from "lucide-react";
import FocusVisibleDebugger from "./FocusVisibleDebugger";

export default function ListPage() {
  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12 h-dvh">
      <a href="#1">1</a>
      <FocusVisibleDebugger />
      <GridListRoot className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary grid-cols-[auto_1fr_auto]">
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
        className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary grid-cols-[auto_1fr_auto]"
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
        className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary grid-cols-[auto_auto_1fr_auto]"
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
            <CustomRowWithCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRowWithCheckbox />
          </GridListRow>
          <GridListRow asChild rowId="3">
            <CustomRowWithCheckbox />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <Debugger />
        </GridListFooter>
      </GridListRoot>

      <GridListRoot
        className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary grid-cols-[auto_auto_1fr_auto]"
        selectionMode="multiple"
        name="multiple-selection"
        required
      >
        <GridListHeader>
          <h2 className="text-sm font-medium col-span-full">
            Multiple selection
          </h2>
        </GridListHeader>
        <GridListHeader className="p-1 gap-x-8">
          <div className="text-sm font-medium">Select</div>
          <h3 className="text-sm font-medium">Title</h3>
          <span className="text-sm font-medium">Amount</span>
          <div className="text-sm font-medium">actions</div>
        </GridListHeader>
        <GridListBody>
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
    <div className="items-center data-[focus-visible=true]:outline-2 outline-primary rounded-md p-1 gap-x-8">
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

function CustomRowWithCheckbox() {
  return (
    <div className="items-center data-[focus-visible=true]:outline-2 outline-primary rounded-md p-1 gap-x-8">
      <div className="p-1">
        <GridListCheckbox
          asChild
          checkedPropName="checked"
          onChangePropName="onCheckedChange"
        >
          <Checkbox />
        </GridListCheckbox>
      </div>

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
