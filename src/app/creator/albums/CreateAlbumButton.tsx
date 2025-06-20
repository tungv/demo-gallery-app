import {
	FormBoundary,
	FormErrorMessage,
	InteractiveForm,
	LoadingMessage,
	SubmitButton,
	SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormField,
	FormLabel,
	FormMessage,
	InputControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { PlusIcon, XIcon } from "lucide-react";

export default function CreateAlbumButton() {
	return (
		<FormBoundary>
			<Dialog>
				<DialogTrigger asChild>
					<Button>
						<PlusIcon className="size-4" />
						Create Album
					</Button>
				</DialogTrigger>

				<DialogContent>
					<Form asChild className="contents">
						<InteractiveForm
							action={async (formData) => {
								"use server";

								const title = formData.get("title") as string;

								if (!title) {
									return {
										errors: {
											title: ["Title is required"],
										},
									};
								}

								if (title === "test") {
									return {
										errors: {
											title: ["Title cannot be 'test'"],
										},
									};
								}

								return {
									result: {
										title,
									},
								};
							}}
						>
							<DialogHeader>
								<DialogTitle>Create Album</DialogTitle>
								<DialogDescription>
									Create a new album to store your images.
								</DialogDescription>
							</DialogHeader>

							<FormField name="title">
								<FormLabel>Title</FormLabel>
								<InputControl asChild>
									<Input required placeholder="Enter album title..." />
								</InputControl>
								<ReserveLayout placeItems="start">
									<FormMessage match="valueMissing">
										Please enter a title for your album
									</FormMessage>
									<FormErrorMessage match="invalid_value">
										<span>Title cannot be "test"</span>
									</FormErrorMessage>
								</ReserveLayout>
							</FormField>

							<DialogFooter>
								<Button asChild>
									<SubmitButton>
										<PlusIcon className="size-4" />
										<ReserveLayout>
											<SubmitMessage>Create</SubmitMessage>
											<LoadingMessage>Creating…</LoadingMessage>
										</ReserveLayout>
									</SubmitButton>
								</Button>

								<Button type="reset" variant="outline">
									<XIcon className="size-4" />
									Cancel
								</Button>
							</DialogFooter>
						</InteractiveForm>
					</Form>
				</DialogContent>
			</Dialog>
		</FormBoundary>
	);
}
