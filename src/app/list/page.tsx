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
      <GridListRoot gridColumnTemplate="1fr auto 1fr" className="bg-white p-2">
        <GridListHeader>header</GridListHeader>
        <GridListBody>
          <GridListRow asChild rowId="1">
            <CustomRow />
          </GridListRow>
          <GridListRow asChild rowId="2">
            <CustomRow />
          </GridListRow>
          <GridListRow
            rowId="3"
            className="data-[focused=true]:outline outline-secondary"
          >
            <div>1</div>
            <div>2</div>
            <div>
              <Button variant="outline">
                <PlusIcon />
                <span>Add</span>
              </Button>
            </div>
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
    <div className="items-center data-[focused=true]:outline outline-primary">
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
