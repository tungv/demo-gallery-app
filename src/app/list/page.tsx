import { Button } from "@/components/ui/button";
import {
  Debugger,
  GridListBody,
  GridListFooter,
  GridListHeader,
  GridListRoot,
  GridListRow,
} from "@/components/ui/grid-list";
import { PlusIcon, TrashIcon } from "lucide-react";

export default function ListPage() {
  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12">
      <a href="#1">1</a>
      <GridListRoot
        gridColumnTemplate="auto 1fr auto"
        className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary"
      >
        <GridListHeader className="p-1 gap-x-8">
          <h2 className="text-sm font-medium">Title</h2>
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
        gridColumnTemplate="auto 1fr auto"
        className="bg-white p-2 rounded-lg data-[focus-visible=true]:outline-2 outline-primary"
        cycleRowFocus
      >
        <GridListHeader className="p-1 gap-x-8">
          <h2 className="text-sm font-medium">Title</h2>
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
