import { Button } from "@/components/ui/button";
import {
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
      <GridListRoot gridColumnTemplate="1fr auto 1fr" className="bg-white">
        <GridListHeader>header</GridListHeader>
        <GridListBody>
          <GridListRow asChild rowId="1">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRow />
          </GridListRow>
          <GridListRow rowId="3">
            <div>1</div>
            <div>2</div>
            <div>3</div>
          </GridListRow>
        </GridListBody>
        <GridListFooter>footer</GridListFooter>
      </GridListRoot>
      <Button>After</Button>
    </div>
  );
}

function CustomRow() {
  return (
    <div className="items-center">
      <h2>row title</h2>

      <span>10,000,000</span>

      <div>
        <Button>
          <PlusIcon />
          <span>Add</span>
        </Button>
      </div>
    </div>
  );
}
