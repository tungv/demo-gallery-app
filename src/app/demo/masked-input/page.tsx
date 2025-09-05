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

import { BAD_FORMAT_ERROR } from "@/components/behaviors/masked-input";

export default function MaskedInputPage() {
  return (
    <Form className="grid grid-cols-1 gap-4 mx-auto max-w-lg p-4">
      <FormField name="n1">
        <h1 className="text-2xl font-bold">
          Masked Input for simple &lt;input&gt; tag
        </h1>
        <p className="text-sm text-muted-foreground">
          A masked input is an input that allows you to mask the input value.
        </p>

        <pre className="font-mono text-sm tracking-tight">{`<MaskedInput
  parse={parse}
  format={format}
  placeholder="Choose a number"
  className="w-full bg-accent p-1 border-b"
/>`}</pre>

        <InputControl asChild>
          <MaskedInput
            parse={parse}
            format={format}
            placeholder="Choose a number"
            className="w-full bg-accent p-1 border-b"
          />
        </InputControl>

        <ErrorMessages />
      </FormField>

      <FormField name="n2">
        <h2 className="text-lg font-bold">
          Masked Input with custom component
        </h2>
        <p className="text-sm text-muted-foreground">
          A masked input that accepts a child component.
        </p>

        <pre className="font-mono text-sm tracking-tight">{`<MaskedInput asChild parse={parse} format={format}>
  <Input placeholder="Choose a number" />
</MaskedInput>`}</pre>

        <InputControl asChild>
          <MaskedInput asChild parse={parse} format={format}>
            <Input placeholder="Choose a number" />
          </MaskedInput>
        </InputControl>

        <ErrorMessages />
      </FormField>

      <FormField name="n3">
        <h2 className="text-lg font-bold">Masked Input with required</h2>
        <p className="text-sm text-muted-foreground">
          A masked input that accepts a child component. (required)
        </p>

        <pre className="font-mono text-sm tracking-tight">{`<MaskedInput asChild parse={parse} format={format}>
  <Input placeholder="Choose a number" required />
</MaskedInput>`}</pre>

        <InputControl asChild>
          <MaskedInput asChild parse={parse} format={format}>
            <Input placeholder="Choose a number" required />
          </MaskedInput>
        </InputControl>

        <ErrorMessages />
      </FormField>

      <p>
        When the form is submitted, only valid unformatted values are sent to
        the server. Look at the URL to see the unformatted value.
      </p>
      <FormSubmit>Submit</FormSubmit>
    </Form>
  );
}

function ErrorMessages() {
  return (
    <>
      <FormMessage match="valueMissing">This field is required</FormMessage>
      <FormMessage match={BAD_FORMAT_ERROR}>
        This field is invalid (customError)
      </FormMessage>
    </>
  );
}
