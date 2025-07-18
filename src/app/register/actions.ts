"use server";

import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { initializeDatabase } from "@/lib/db/schema";

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  try {
    // Ensure database is initialized
    await initializeDatabase();

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}
    `;

    if (existingUser.rows.length > 0) {
      throw new Error("An account with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name.trim()}, ${email.toLowerCase().trim()}, ${passwordHash})
      RETURNING id::text
    `;

    const userId = result.rows[0].id;

    // Create token and set cookie
    const token = await createToken(userId);
    await setAuthCookie(token);

    // Redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create account");
  }
}