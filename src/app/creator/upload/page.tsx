import { Title } from "@/components/typography";
import {
  Form,
  FormControlItem,
  FormField,
  FormLabel,
  FormMessage,
  FormSubmit,
  InputControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  FormErrorMessage,
  InteractiveForm,
  PrintResult,
} from "@/components/behaviors/interactive-form";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <Title className="mb-8">Upload</Title>

      <Form asChild>
        <InteractiveForm
          className="data-[user-invalid]:border-red-500 border"
          action={async (formData) => {
            "use server";
            console.log("action");
            const title = formData.get("image_title");
            const description = formData.get("image_description");
            const visibility = formData.get("visibility");

            if (!title) {
              return { errors: ["missing_title"] };
            }

            if (title === "test") {
              return { errors: ["invalid_title"] };
            }

            if (!description) {
              return { errors: ["missing_description"] };
            }

            if (!visibility) {
              return { errors: ["missing_visibility"] };
            }

            return {
              result: {
                title,
                description,
                visibility,
              },
            };
          }}
        >
          <FormField name="image_title">
            <FormLabel>Image Title</FormLabel>
            <InputControl asChild>
              <Input
                defaultValue="test"
                required
                placeholder="Enter image title..."
                minLength={3}
              />
            </InputControl>
            <div className="pile">
              <FormMessage match="valueMissing">
                Please enter a title for your image
              </FormMessage>
              <FormMessage match="tooShort">
                Title must be at least 3 characters long
              </FormMessage>
              <FormErrorMessage match="invalid_title">
                Title cannot be "test"
              </FormErrorMessage>
              <FormMessage match="valid">&nbsp;</FormMessage>
            </div>
          </FormField>
          <FormField name="image_description">
            <FormLabel>Image Description</FormLabel>
            <InputControl asChild>
              <Textarea
                defaultValue="test"
                required
                placeholder="Enter image description..."
                minLength={3}
              />
            </InputControl>
            <div className="pile">
              <FormMessage match="valueMissing">
                Please enter a description for your image
              </FormMessage>
              <FormMessage match="tooShort">
                Description must be at least 3 characters long
              </FormMessage>
              <FormMessage match="valid">&nbsp;</FormMessage>
            </div>
          </FormField>
          <FormField name="visibility">
            <FormLabel>Visibility</FormLabel>

            <InputControl asChild>
              <RadioGroup required>
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

            <div className="pile">
              <FormMessage match="valueMissing">
                Please select a visibility for your image
              </FormMessage>
              <FormMessage match="valid">&nbsp;</FormMessage>
            </div>
          </FormField>
          <footer className="flex flex-row-reverse justify-between gap-2">
            <FormSubmit>Upload Image</FormSubmit>
            <button type="reset">Reset</button>
          </footer>
        </InteractiveForm>
      </Form>
    </div>
  );
}
