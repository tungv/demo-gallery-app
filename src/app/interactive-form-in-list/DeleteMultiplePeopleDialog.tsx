import {
	InteractiveForm,
	LoadingMessage,
	SubmitButton,
	SubmitMessage,
	Success,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import {
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GridCurrentSelectedRowsInput } from "@/components/ui/grid-list";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { Trash2 } from "lucide-react";
import { AutoCloseDialog } from "./PeopleListDialog";
import SelectedPeopleNameList from "./SelectedPeopleNameList";
import { deletePeopleByIds } from "./actions";

export default function DeleteMultiplePeopleDialog() {
	return (
		<InteractiveForm
			className="contents"
			action={async (formData) => {
				"use server";
				const selected = formData.getAll("deleting-id-array") as string[];
				await deletePeopleByIds(selected);
				return {
					refresh: true,
					result: "success",
				};
			}}
		>
			<DialogHeader>
				<DialogTitle>Delete multiple people</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete the selected people?
				</DialogDescription>
			</DialogHeader>

			<p>People to delete:</p>
			<SelectedPeopleNameList />

			<GridCurrentSelectedRowsInput name="deleting-id-array" />
			<Success>
				<AutoCloseDialog />
			</Success>

			<DialogFooter>
				<DialogClose asChild>
					<Button variant="outline" size="sm">
						Cancel
					</Button>
				</DialogClose>

				<SubmitButton asChild>
					<Button variant="destructive" size="sm" className="gap-2">
						<Trash2 className="size-4" />
						<ReserveLayout>
							<LoadingMessage>Deleting...</LoadingMessage>
							<SubmitMessage>Delete multiple</SubmitMessage>
						</ReserveLayout>
					</Button>
				</SubmitButton>
			</DialogFooter>
		</InteractiveForm>
	);
}
