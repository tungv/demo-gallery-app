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
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  
  // Redirect if already logged in
  const user = await getCurrentUser();
  if (user) {
    redirect(returnTo || "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <Form action={loginAction} className="space-y-6">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
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
                autoComplete="current-password"
              />
            </InputControl>
            <FormMessage match="valueMissing">Password is required</FormMessage>
          </FormField>

          <FormSubmit asChild>
            <Button className="w-full">
              Sign in
            </Button>
          </FormSubmit>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}