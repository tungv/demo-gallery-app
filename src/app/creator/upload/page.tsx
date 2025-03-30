import { Title } from "@/components/typography";
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormSubmit,
  InputControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <Title className="mb-8">Upload</Title>

      <Form className="invalid:border-red-500 border">
        <FormField name="image_title">
          <FormLabel>Image Title</FormLabel>
          <InputControl asChild>
            <Input required placeholder="Enter image title..." minLength={3} />
          </InputControl>
          <div className="pile">
            <FormMessage match="valueMissing">
              Please enter a title for your image
            </FormMessage>
            <FormMessage match="tooShort">
              Title must be at least 3 characters long
            </FormMessage>
            <FormMessage match="valid">&nbsp;</FormMessage>
          </div>
        </FormField>

        <FormSubmit>Upload Image</FormSubmit>
        <button type="reset">Reset</button>
      </Form>
    </div>
  );
}
