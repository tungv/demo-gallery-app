"use server";

import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { removeAuthCookie, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logoutAction() {
  await removeAuthCookie();
  redirect("/");
}

export async function createListAction(formData: FormData) {
  const user = await requireAuth();
  const name = formData.get("name") as string;

  if (!name?.trim()) {
    throw new Error("List name is required");
  }

  try {
    // Create the shopping list
    const result = await sql`
      INSERT INTO shopping_lists (name, admin_user_id)
      VALUES (${name.trim()}, ${parseInt(user.id)})
      RETURNING id
    `;

    const listId = result.rows[0].id;

    // Add the creator as a member
    await sql`
      INSERT INTO shopping_list_members (list_id, user_id, invitation_accepted)
      VALUES (${listId}, ${parseInt(user.id)}, true)
    `;

    revalidatePath("/dashboard");
    redirect(`/lists/${listId}`);
  } catch (error) {
    console.error("Error creating list:", error);
    throw new Error("Failed to create shopping list");
  }
}