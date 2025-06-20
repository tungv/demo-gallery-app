import {
	FormBoundary,
	FormErrorMessage,
	InteractiveForm,
	LoadingMessage,
	PrintResult,
	SubmitButton,
	SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormLabel, InputControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import { CheckIcon, Loader2, PencilIcon, XIcon } from "lucide-react";
import {
	AlbumCardRoot,
	EditMode,
	ModeToggleButton,
	ViewMode,
} from "./AlbumCard.ui";

export default function AlbumGrid() {
	return (
		<div className="grid grid-cols-2 gap-8 p-8 w-fit">
			<AlbumCard />
			<AlbumCard />
			<AlbumCard />
			<AlbumCard />
		</div>
	);
}

function AlbumCard() {
	return (
		<FormBoundary>
			<AlbumCardRoot>
				<article className="place-self-center text-lg font-bold text-muted-foreground">
					thumbnail
				</article>
				<footer className="flex items-center gap-2 flex-row justify-between p-2 bg-muted">
					<ViewMode className="contents">
						<span>Untitled Album 1</span>
						<Button variant="outline" asChild>
							<ModeToggleButton>
								<PencilIcon className="size-4" />
								<span className="sr-only">Edit</span>
							</ModeToggleButton>
						</Button>
					</ViewMode>

					<EditMode className="contents">
						<Form className="contents" asChild>
							<InteractiveForm
								fields={["title"]}
								action={async (formData) => {
									"use server";
									const title = formData.get("title") as string;
									if (!title) {
										return { errors: { title: ["valueMissing"] } };
									}

									return { result: { success: true } };
								}}
							>
								<FormField name="title" className="relative">
									<FormLabel className="sr-only">Album Title</FormLabel>
									<InputControl asChild>
										<Input
											autoFocus
											placeholder="Album title"
											defaultValue="Untitled Album 1"
										/>
									</InputControl>
									<FormErrorMessage
										name="title"
										className="absolute bottom-full text-sm text-destructive p-1 mb-1 bg-white rounded-md"
									>
										<p>Title is required</p>
									</FormErrorMessage>
								</FormField>
								<Button variant="outline" asChild>
									<SubmitButton>
										<SubmitMessage>
											<CheckIcon className="size-4" />
											<span className="sr-only">Save</span>
										</SubmitMessage>
										<LoadingMessage>
											<Loader2 className="size-4 animate-spin" />
											<span className="sr-only">Saving…</span>
										</LoadingMessage>
									</SubmitButton>
								</Button>
								<Button variant="outline" asChild>
									<ModeToggleButton>
										<XIcon className="size-4" />
										<span className="sr-only">Cancel</span>
									</ModeToggleButton>
								</Button>
							</InteractiveForm>
						</Form>
					</EditMode>
				</footer>
			</AlbumCardRoot>
		</FormBoundary>
	);
}
