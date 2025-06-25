import {
  FormErrorMessage,
  InteractiveForm,
  LoadingMessage,
  SubmitButton,
  SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  InputControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ReserveLayout } from "@/components/ui/reserve-layout";

export default function Login() {
  return (
    <div className="h-dvh grid grid-cols-1 gap-8 p-8 place-items-center w-dvw">
      <Form asChild>
        <InteractiveForm
          className="grid grid-cols-1 gap-2 bg-white rounded-lg p-8 border h-fit"
          action={async (formData) => {
            "use server";
            const username = formData.get("username");
            const password = formData.get("password");

            if (!password) {
              return {
                errors: {
                  // server validation
                  password: ["valueMissing"],
                },
              };
            }

            if (password.length < 8) {
              return {
                errors: {
                  // server validation
                  password: ["tooShort"],
                },
              };
            }

            return {
              redirect: "/demo/dashboard",
            };
          }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Login</h1>
          <FormField name="username">
            <FormLabel>Username</FormLabel>
            <InputControl asChild>
              <Input required placeholder="Enter your username" />
            </InputControl>
            <ReserveLayout placeItems="start">
              <FormMessage match="valueMissing">
                Username is required
              </FormMessage>
            </ReserveLayout>
          </FormField>

          <FormField name="password">
            <FormLabel>Password</FormLabel>
            <InputControl asChild>
              <Input
                required
                placeholder="Enter your password"
                type="password"
              />
            </InputControl>
            <ReserveLayout placeItems="start">
              <FormMessage match="valueMissing">
                Password is required
              </FormMessage>
              <FormErrorMessage match="tooShort">
                Password must be at least 8 characters long (server validation)
              </FormErrorMessage>
            </ReserveLayout>
          </FormField>

          <SubmitButton asChild>
            <Button>
              <SubmitMessage>Login</SubmitMessage>
              <LoadingMessage>Logging in…</LoadingMessage>
            </Button>
          </SubmitButton>
        </InteractiveForm>
      </Form>
    </div>
  );
}
