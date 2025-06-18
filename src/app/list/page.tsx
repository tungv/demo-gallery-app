import { Button } from "@/components/ui/button";
import { Form, FormSubmit } from "@/components/ui/form";
import {
  GridListDebugger,
  GridListBody,
  GridListFooter,
  GridListHeader,
  GridListTitle,
  GridListCaption,
  GridListItemIndicatorRoot,
  GridListItemSelectedIndicator,
  GridListItemUnselectedIndicator,
  GridListItemIndeterminateIndicator,
  GridListRoot,
  GridListRow,
  GridListColumnHeader,
  GridListRowHeader,
} from "@/components/ui/grid-list";
import { cn } from "@/lib/utils";
import {
  CheckSquare2,
  MinusSquareIcon,
  PlusIcon,
  Square,
  TrashIcon,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import ActionRow from "./ActionRow";

export default function ListPage() {
  return (
    <div className="bg-muted grid grid-cols-1 gap-12 p-12 h-dvh">
      <Form
        className="contents"
        action={async (formData) => {
          "use server";
          console.log(formData.getAll("multiple-selection"));
        }}
      >
        <GridListRoot
          className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit"
          selectionMode="multiple"
          name="multiple-selection"
          initialValue={["4", "6"]}
          required
        >
          <GridListTitle className=" p-2">
            Multiple Selection Example
          </GridListTitle>
          <GridListCaption className=" px-2 pb-2">
            Select multiple rows using checkboxes or spacebar. Header checkbox
            selects/deselects all.
          </GridListCaption>
          <GridListHeader className="p-1 gap-x-8">
            <GridListRow>
              <GridListColumnHeader className="text-sm font-medium px-1">
                <CustomCheckbox />
              </GridListColumnHeader>
              <GridListColumnHeader className="text-sm font-medium">
                Title
              </GridListColumnHeader>
              <GridListColumnHeader
                className="text-sm font-medium"
                sortDirection="ascending"
                sortable
              >
                Amount
              </GridListColumnHeader>
              <GridListColumnHeader className="text-sm font-medium">
                actions
              </GridListColumnHeader>
            </GridListRow>
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
            <ActionRow />
          </GridListFooter>
          <GridListFooter>
            <GridListDebugger />
          </GridListFooter>
        </GridListRoot>

        <FormSubmit>Submit</FormSubmit>
      </Form>

      <GridListRoot
        className="bg-white rounded-lg grid-cols-[auto_auto_1fr_auto] h-fit"
        selectionMode="multiple"
        name="disabled-readonly-example"
        initialValue={["8", "10"]}
      >
        <GridListTitle className="col-span-full p-2">
          Disabled and Read-only Rows
        </GridListTitle>
        <GridListCaption className="col-span-full px-2 pb-2">
          This example shows disabled and read-only rows. Try using spacebar to
          toggle selection on different row types.
        </GridListCaption>
        <GridListHeader className="p-1 gap-x-8">
          <GridListRow>
            <GridListColumnHeader className="text-sm font-medium px-1">
              <CustomCheckbox />
            </GridListColumnHeader>
            <GridListColumnHeader className="text-sm font-medium">
              Title
            </GridListColumnHeader>
            <GridListColumnHeader className="text-sm font-medium">
              Amount
            </GridListColumnHeader>
            <GridListColumnHeader className="text-sm font-medium">
              actions
            </GridListColumnHeader>
          </GridListRow>
        </GridListHeader>
        <GridListBody className="divide-y border-y">
          <GridListRow asChild rowId="7">
            <CustomRowWithCheckboxAndTitle title="Normal row" />
          </GridListRow>
          <GridListRow asChild rowId="8" readOnly>
            <CustomRowWithCheckboxAndTitle title="Read-only row" readOnly />
          </GridListRow>
          <GridListRow asChild rowId="9" disabled>
            <CustomRowWithCheckboxAndTitle title="Disabled row" disabled />
          </GridListRow>
          <GridListRow asChild rowId="10">
            <CustomRowWithCheckboxAndTitle title="Another normal row" />
          </GridListRow>
        </GridListBody>
        <GridListFooter>
          <GridListDebugger />
        </GridListFooter>
      </GridListRoot>
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

      <GridListRowHeader>row title</GridListRowHeader>

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

function CustomRowWithCheckboxAndTitle({
  title = "row title",
  readOnly = false,
  disabled = false,
  ...divProps
}: {
  title?: string;
  readOnly?: boolean;
  disabled?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "items-center focus-visible:outline-2 outline-primary p-1 gap-x-8 data-[selected=true]:bg-primary/10 first:rounded-t-md last:rounded-b-md",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        readOnly ? "bg-gray-50" : "",
      )}
      {...divProps}
    >
      <div className="p-1">
        <CustomCheckbox />
      </div>

      <GridListRowHeader className="p-1 font-medium">{title}</GridListRowHeader>

      <span className="p-1 tabular-nums">10,000,000</span>

      <div className="flex gap-x-2 items-center">
        <Button
          className="focus-visible:outline-2 outline-primary"
          disabled={disabled}
        >
          <PlusIcon />
          <span>Add</span>
        </Button>

        <Button
          variant="destructive"
          className="focus-visible:outline-2 outline-primary"
          disabled={disabled}
        >
          <TrashIcon />
          <span>Remove</span>
        </Button>
      </div>
    </div>
  );
}

function CustomRowWithTraditionalCheckbox(
  divProps: HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className="items-center focus-visible:outline-2 outline-primary rounded-md p-1 gap-x-8 data-[selected=true]:bg-primary/10"
      {...divProps}
    >
      <div className="p-1">
        <GridListItemIndicatorRoot />
      </div>

      <GridListRowHeader>row title</GridListRowHeader>

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
