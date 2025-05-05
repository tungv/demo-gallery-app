import { Title } from "@/components/typography";
import {
  Form,
  FormControlItem,
  FormField,
  FormLabel,
  FormMessage,
  InputControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  FormErrorMessage,
  InteractiveForm,
  LoadingMessage,
  SubmitButton,
  SubmitMessage,
} from "@/components/behaviors/interactive-form";
import CategoryCombobox from "./CategoryCombobox";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { ReserveLayout } from "@/components/ui/reserve-layout";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <Title className="mb-8">Upload</Title>

      <Form asChild>
        <InteractiveForm
          fields={[
            "image_title",
            "image_description",
            "visibility",
            "image_tags",
          ]}
          className="data-[user-invalid]:border-red-500 border rounded-md shadow-sm"
          action={async (formData) => {
            "use server";

            const title = formData.get("image_title");
            const description = formData.get("image_description");
            const visibility = formData.get("visibility");
            const tags = formData.getAll("image_tags");

            if (!title) {
              return {
                errors: {
                  image_title: ["valueMissing"],
                },
              };
            }

            if (title === "test") {
              return {
                errors: {
                  image_title: ["invalid_value"],
                },
              };
            }

            if (!description) {
              return {
                errors: {
                  image_description: ["valueMissing"],
                },
              };
            }

            if (!visibility) {
              return {
                errors: {
                  visibility: ["valueMissing"],
                },
              };
            }

            return {
              result: {
                title,
                description,
                visibility,
                tags,
              },
              redirect: "/creator/upload/success",
            };
          }}
        >
          <ImageNameField />

          <ImageDescriptionField />
          <ImageTagsField />
          <ImageVisibilityField />

          <footer className="flex flex-row-reverse justify-between gap-2">
            <Button asChild>
              <SubmitButton>
                <UploadIcon className="size-4" />
                <ReserveLayout>
                  <SubmitMessage>Upload Image</SubmitMessage>
                  <LoadingMessage>Uploading…</LoadingMessage>
                </ReserveLayout>
              </SubmitButton>
            </Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </footer>
        </InteractiveForm>
      </Form>
    </div>
  );
}

function ImageNameField() {
  return (
    <FormField name="image_title">
      <FormLabel>Image Title</FormLabel>
      <InputControl asChild>
        <Input required placeholder="Enter image title..." minLength={3} />
      </InputControl>
      <ReserveLayout placeItems="start">
        <FormMessage match="valueMissing">
          Please enter a title for your image
        </FormMessage>
        <FormMessage match="tooShort">
          Title must be at least 3 characters long
        </FormMessage>
        <FormErrorMessage name="image_title" match="invalid_value">
          Title cannot be "test"
        </FormErrorMessage>
      </ReserveLayout>
    </FormField>
  );
}

function ImageDescriptionField() {
  return (
    <FormField name="image_description">
      <FormLabel>Image Description</FormLabel>
      <InputControl asChild>
        <Textarea
          required
          placeholder="Enter image description..."
          minLength={3}
        />
      </InputControl>
      <ReserveLayout placeItems="start">
        <FormMessage match="valueMissing">
          Please enter a description for your image
        </FormMessage>
        <FormMessage match="tooShort">
          Description must be at least 3 characters long
        </FormMessage>
      </ReserveLayout>
    </FormField>
  );
}

function ImageTagsField() {
  return (
    <FormField name="image_tags">
      <FormLabel>Image Tags</FormLabel>
      <InputControl asChild>
        <CategoryCombobox />
      </InputControl>

      <ReserveLayout placeItems="start">
        <FormMessage match="valueMissing">
          Please select at least one tag
        </FormMessage>
      </ReserveLayout>
    </FormField>
  );
}

function ImageVisibilityField() {
  return (
    <FormField name="visibility">
      <FormLabel>Visibility</FormLabel>

      <InputControl asChild>
        <RadioGroup required defaultValue="public">
          <FormControlItem className="flex items-center gap-2">
            <InputControl asChild>
              <RadioGroupItem value="public" />
            </InputControl>
            <FormLabel>Public</FormLabel>
          </FormControlItem>

          <FormControlItem className="flex items-center gap-2">
            <InputControl asChild>
              <RadioGroupItem value="private" />
            </InputControl>
            <FormLabel>Private</FormLabel>
          </FormControlItem>
        </RadioGroup>
      </InputControl>

      <ReserveLayout placeItems="start">
        <FormMessage match="valueMissing">
          Please select a visibility for your image
        </FormMessage>
      </ReserveLayout>
    </FormField>
  );
}
