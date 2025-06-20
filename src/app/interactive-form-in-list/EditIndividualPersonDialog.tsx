import {
	InteractiveForm,
	LoadingMessage,
	SubmitButton,
	SubmitMessage,
	Success,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormLabel, InputControl } from "@/components/ui/form";
import { GridCurrentFocusInput } from "@/components/ui/grid-list";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import EditPersonFormInput from "./EditPersonFormInput";
import { AutoCloseDialog } from "./PeopleListDialog";
import { updatePersonByIdInStorage } from "./data-store";

export default function EditIndividualPersonDialog() {
	return (
		<Form asChild className="contents">
			<InteractiveForm
				action={async (formData) => {
					"use server";
					const id = formData.get("person-id") as string;
					const name = formData.get("name") as string;
					const email = formData.get("email") as string;
					const phone = formData.get("phone") as string;
					const address = formData.get("address") as string;
					const city = formData.get("city") as string;
					const state = formData.get("state") as string;
					const zip = formData.get("zip") as string;

					const success = await updatePersonByIdInStorage(id, {
						name,
						email,
						phone,
						address,
						city,
						state,
						zip,
					});

					if (success) {
						revalidatePath("/interactive-form-in-list");
						return {
							refresh: true,
							result: "success",
						};
					}

					return {
						errors: {
							$: ["Failed to update person"],
						},
					};
				}}
			>
				<DialogHeader>
					<DialogTitle>Edit person</DialogTitle>
					<DialogDescription>Edit the person's information.</DialogDescription>
					<GridCurrentFocusInput name="person-id" />
				</DialogHeader>

				<Success>
					<AutoCloseDialog />
				</Success>

				<FormField name="name">
					<FormLabel>Name</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="name"
							placeholder="Name"
							className="w-full"
						/>
					</InputControl>
				</FormField>

				<FormField name="email">
					<FormLabel>Email</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="email"
							placeholder="Email"
							className="w-full"
							type="email"
						/>
					</InputControl>
				</FormField>

				<FormField name="phone">
					<FormLabel>Phone</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="phone"
							placeholder="Phone"
							className="w-full"
							type="tel"
						/>
					</InputControl>
				</FormField>

				<FormField name="address">
					<FormLabel>Address</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="address"
							placeholder="Address"
							className="w-full"
						/>
					</InputControl>
				</FormField>

				<FormField name="city">
					<FormLabel>City</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="city"
							placeholder="City"
							className="w-full"
						/>
					</InputControl>
				</FormField>

				<FormField name="state">
					<FormLabel>State</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="state"
							placeholder="State"
							className="w-full"
						/>
					</InputControl>
				</FormField>

				<FormField name="zip">
					<FormLabel>Zip</FormLabel>
					<InputControl asChild>
						<EditPersonFormInput
							dataKeyName="zip"
							placeholder="Zip"
							className="w-full"
						/>
					</InputControl>
				</FormField>

				<DialogFooter>
					<SubmitButton asChild>
						<Button size="sm">
							<Save className="size-4" />
							<ReserveLayout>
								<LoadingMessage>Saving...</LoadingMessage>
								<SubmitMessage>Save</SubmitMessage>
							</ReserveLayout>
						</Button>
					</SubmitButton>
				</DialogFooter>
			</InteractiveForm>
		</Form>
	);
}
