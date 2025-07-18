"use server";

import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnTo = formData.get("returnTo") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    // Find user by email
    const result = await sql`
      SELECT 
        id::text,
        email,
        name,
        password_hash,
        created_at::text
      FROM users 
      WHERE email = ${email.toLowerCase().trim()}
    `;

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0] as User;

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Create token and set cookie
    const token = await createToken(user.id);
    await setAuthCookie(token);

    // Redirect to returnTo or dashboard
    redirect(returnTo || "/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Invalid email or password");
  }
}