import { Title } from "@/components/typography";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormSubmit,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <Title className="mb-8">Upload</Title>

      <Form>
        <FormField name="image_title">
          <FormLabel>Image Title</FormLabel>
          <FormControl asChild>
            <Input required placeholder="Enter image title..." />
          </FormControl>
          <FormMessage match="valueMissing">
            Please enter a title for your image
          </FormMessage>
        </FormField>

        <FormSubmit>Upload Image</FormSubmit>
      </Form>
    </div>
  );
}
