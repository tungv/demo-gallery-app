import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormLabel,
  InputControl,
  FormMessage,
  FormSubmit,
} from "@/components/ui/form";
import { getCurrentUser } from "@/lib/auth";
import { registerAction } from "./actions";

export default async function RegisterPage() {
  // Redirect if already logged in
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Get started with your shopping lists
          </p>
        </div>

        <Form action={registerAction} className="space-y-6">
          <FormField name="name">
            <FormLabel>Name</FormLabel>
            <InputControl asChild>
              <Input
                type="text"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </InputControl>
            <FormMessage match="valueMissing">Name is required</FormMessage>
          </FormField>

          <FormField name="email">
            <FormLabel>Email</FormLabel>
            <InputControl asChild>
              <Input
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </InputControl>
            <FormMessage match="valueMissing">Email is required</FormMessage>
            <FormMessage match="typeMismatch">Invalid email address</FormMessage>
          </FormField>

          <FormField name="password">
            <FormLabel>Password</FormLabel>
            <InputControl asChild>
              <Input
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </InputControl>
            <FormMessage match="valueMissing">Password is required</FormMessage>
            <FormMessage match="tooShort">
              Password must be at least 8 characters
            </FormMessage>
          </FormField>

          <FormField name="confirmPassword">
            <FormLabel>Confirm Password</FormLabel>
            <InputControl asChild>
              <Input
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </InputControl>
            <FormMessage match="valueMissing">
              Please confirm your password
            </FormMessage>
          </FormField>

          <FormSubmit asChild>
            <Button className="w-full">
              Create account
            </Button>
          </FormSubmit>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}