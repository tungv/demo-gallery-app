import { Button } from "@/components/ui/button";
import {
  Debugger,
  GridListBody,
  GridListFooter,
  GridListHeader,
  GridListRoot,
  GridListRow,
} from "@/components/ui/grid-list";
import { PlusIcon } from "lucide-react";

export default function ListPage() {
  return (
    <div className="bg-muted p-12">
      <Button>Before</Button>
      <GridListRoot
        gridColumnTemplate="auto 1fr auto"
        className="bg-white p-2 rounded-lg focus-within:outline-2"
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
      </GridListRoot>
      <Button>After</Button>
    </div>
  );
}

function CustomRow() {
  return (
    <div className="items-center data-[focused=true]:outline-2 outline-primary rounded-md p-1 gap-x-8">
      <h2 className="p-1 font-medium">row title</h2>

      <span className="p-1 tabular-nums">10,000,000</span>

      <div className="ml-auto">
        <Button>
          <PlusIcon />
          <span>Add</span>
        </Button>
      </div>
    </div>
  );
}
