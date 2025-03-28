import { Title } from "@/components/typography";
import { Form, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  Root,
  Field,
  Label,
  Message,
  Submit,
} from "@radix-ui/react-form";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Title>Upload</Title>

      <Root>
        <Field name="image_title">
          <Label>Image Title</Label>
          <FormControl asChild>
            <Input required />
          </FormControl>
          <Message match="valueMissing">Required</Message>
        </Field>

        <Submit>Upload</Submit>
      </Root>
    </div>
  );
}
