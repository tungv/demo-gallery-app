"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@vercel/postgres";
import { requireAuth } from "@/lib/auth";

export async function addItemAction(formData: FormData) {
  const user = await requireAuth();
  const listId = formData.get("listId") as string;
  const name = formData.get("name") as string;
  const shop = formData.get("shop") as string;
  const notes = formData.get("notes") as string;

  if (!listId || !name?.trim()) {
    throw new Error("List ID and item name are required");
  }

  try {
    // Verify user has access to this list
    const accessCheck = await sql`
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = ${parseInt(listId)}
      AND (
        sl.admin_user_id = ${parseInt(user.id)}
        OR EXISTS (
          SELECT 1 FROM shopping_list_members slm
          WHERE slm.list_id = sl.id 
          AND slm.user_id = ${parseInt(user.id)}
          AND slm.invitation_accepted = true
        )
      )
    `;

    if (accessCheck.rows.length === 0) {
      throw new Error("You don't have access to this list");
    }

    // If shop is provided and new, add it to the shops table
    if (shop?.trim()) {
      await sql`
        INSERT INTO shops (name, list_id)
        VALUES (${shop.trim()}, ${parseInt(listId)})
        ON CONFLICT (name, list_id) DO NOTHING
      `;
    }

    // Add the item
    await sql`
      INSERT INTO shopping_items (
        list_id,
        name,
        shop_tag,
        notes,
        created_by_user_id
      )
      VALUES (
        ${parseInt(listId)},
        ${name.trim()},
        ${shop?.trim() || null},
        ${notes?.trim() || null},
        ${parseInt(user.id)}
      )
    `;

    revalidatePath(`/lists/${listId}`);
  } catch (error) {
    console.error("Error adding item:", error);
    throw new Error("Failed to add item");
  }
}

export async function toggleItemStatusAction(formData: FormData) {
  const user = await requireAuth();
  const itemId = formData.get("itemId") as string;
  const currentStatus = formData.get("currentStatus") as string;

  if (!itemId) {
    throw new Error("Item ID is required");
  }

  try {
    // Verify user has access to this item's list
    const accessCheck = await sql`
      SELECT si.list_id::text
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE si.id = ${parseInt(itemId)}
      AND (
        sl.admin_user_id = ${parseInt(user.id)}
        OR EXISTS (
          SELECT 1 FROM shopping_list_members slm
          WHERE slm.list_id = sl.id 
          AND slm.user_id = ${parseInt(user.id)}
          AND slm.invitation_accepted = true
        )
      )
    `;

    if (accessCheck.rows.length === 0) {
      throw new Error("You don't have access to this item");
    }

    const listId = accessCheck.rows[0].list_id;
    const newStatus = currentStatus === 'to_buy_today' ? 'active' : 'to_buy_today';
    const markedByUserId = newStatus === 'to_buy_today' ? parseInt(user.id) : null;
    const markedAt = newStatus === 'to_buy_today' ? new Date().toISOString() : null;

    await sql`
      UPDATE shopping_items
      SET 
        status = ${newStatus},
        marked_by_user_id = ${markedByUserId},
        marked_at = ${markedAt},
        updated_at = NOW()
      WHERE id = ${parseInt(itemId)}
    `;

    revalidatePath(`/lists/${listId}`);
  } catch (error) {
    console.error("Error toggling item status:", error);
    throw new Error("Failed to update item status");
  }
}

export async function markItemBoughtAction(formData: FormData) {
  const user = await requireAuth();
  const itemId = formData.get("itemId") as string;

  if (!itemId) {
    throw new Error("Item ID is required");
  }

  try {
    // Verify user has access to this item's list
    const accessCheck = await sql`
      SELECT si.list_id::text
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE si.id = ${parseInt(itemId)}
      AND (
        sl.admin_user_id = ${parseInt(user.id)}
        OR EXISTS (
          SELECT 1 FROM shopping_list_members slm
          WHERE slm.list_id = sl.id 
          AND slm.user_id = ${parseInt(user.id)}
          AND slm.invitation_accepted = true
        )
      )
    `;

    if (accessCheck.rows.length === 0) {
      throw new Error("You don't have access to this item");
    }

    const listId = accessCheck.rows[0].list_id;

    await sql`
      UPDATE shopping_items
      SET 
        status = 'bought',
        marked_by_user_id = ${parseInt(user.id)},
        marked_at = NOW(),
        updated_at = NOW()
      WHERE id = ${parseInt(itemId)}
    `;

    revalidatePath(`/lists/${listId}`);
  } catch (error) {
    console.error("Error marking item as bought:", error);
    throw new Error("Failed to mark item as bought");
  }
}

export async function generateInvitationLinkAction(listId: string) {
  const user = await requireAuth();

  try {
    // Verify user is admin of this list
    const adminCheck = await sql`
      SELECT 1 FROM shopping_lists
      WHERE id = ${parseInt(listId)}
      AND admin_user_id = ${parseInt(user.id)}
    `;

    if (adminCheck.rows.length === 0) {
      throw new Error("Only list admins can generate invitation links");
    }

    // Generate a unique invitation code
    const invitationCode = crypto.randomUUID();

    // Store the invitation code (you might want to add expiration)
    await sql`
      INSERT INTO shopping_list_members (list_id, user_id, invitation_code, invitation_accepted)
      VALUES (${parseInt(listId)}, ${parseInt(user.id)}, ${invitationCode}, false)
      ON CONFLICT (list_id, user_id) 
      DO UPDATE SET invitation_code = ${invitationCode}
    `;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/join/${invitationCode}`;
  } catch (error) {
    console.error("Error generating invitation link:", error);
    throw new Error("Failed to generate invitation link");
  }
}