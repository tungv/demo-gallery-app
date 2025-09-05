import { MaskedInput } from "@/components/behaviors/masked-input";
import { Input } from "@/components/ui/input";
import { parse, format } from "./number-format";
import {
  Form,
  FormField,
  FormMessage,
  FormSubmit,
  InputControl,
} from "@/components/ui/form";
import { ReserveLayout } from "@/components/ui/reserve-layout";

export default function MaskedInputPage() {
  return (
    <Form className="grid grid-cols-1 gap-4 mx-auto max-w-md p-4">
      <FormField name="n1">
        <h1 className="text-2xl font-bold">Masked Input</h1>
        <p className="text-sm text-muted-foreground">
          A masked input is an input that allows you to mask the input value.
        </p>

        <InputControl asChild>
          <MaskedInput
            parse={parse}
            format={format}
            className="w-full bg-accent p-1 border-b"
          />
        </InputControl>

        <FormMessage match="valueMissing">This field is required</FormMessage>
        <FormMessage match="badFormat">
          This field is invalid (customError)
        </FormMessage>
        <FormMessage match="valid">This field is valid</FormMessage>
      </FormField>

      <FormField name="n2">
        <h2 className="text-lg font-bold">Masked Input</h2>
        <p className="text-sm text-muted-foreground">
          A masked input that accepts a child component.
        </p>

        <InputControl asChild>
          <MaskedInput asChild parse={parse} format={format}>
            <Input placeholder="Type something to search…" />
          </MaskedInput>
        </InputControl>

        <FormMessage match="valueMissing">This field is required</FormMessage>
        <FormMessage match="badFormat">
          This field is invalid (customError)
        </FormMessage>
        <FormMessage match="valid">This field is valid</FormMessage>
      </FormField>

      <FormField name="n3">
        <h2 className="text-lg font-bold">Masked Input</h2>
        <p className="text-sm text-muted-foreground">
          A masked input that accepts a child component. (required)
        </p>

        <InputControl asChild>
          <MaskedInput asChild parse={parse} format={format}>
            <Input name="n3" placeholder="Type something to search…" required />
          </MaskedInput>
        </InputControl>

        <FormMessage match="valueMissing">This field is required</FormMessage>
        <FormMessage match="badFormat">
          This field is invalid (customError)
        </FormMessage>
        <FormMessage match="valid">This field is valid</FormMessage>
      </FormField>

      <FormSubmit>Submit</FormSubmit>
    </Form>
  );
}
