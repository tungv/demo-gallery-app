"use server";

import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { requireAuth } from "@/lib/auth";

export interface InvitationDetails {
  listId: string;
  listName: string;
  invitedByName: string;
  memberCount: number;
  isAlreadyMember: boolean;
}

export async function getInvitationDetails(
  code: string
): Promise<InvitationDetails | null> {
  try {
    // Find the invitation
    const result = await sql`
      SELECT 
        sl.id::text as list_id,
        sl.name as list_name,
        u.name as invited_by_name,
        (SELECT COUNT(*) FROM shopping_list_members WHERE list_id = sl.id AND invitation_accepted = true) as member_count
      FROM shopping_list_members slm
      JOIN shopping_lists sl ON slm.list_id = sl.id
      JOIN users u ON sl.admin_user_id = u.id
      WHERE slm.invitation_code = ${code}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const invitation = result.rows[0];

    // Check if current user (if any) is already a member
    let isAlreadyMember = false;
    try {
      const user = await requireAuth();
      const memberCheck = await sql`
        SELECT 1 FROM shopping_list_members
        WHERE list_id = ${parseInt(invitation.list_id)}
        AND user_id = ${parseInt(user.id)}
        AND invitation_accepted = true
      `;
      isAlreadyMember = memberCheck.rows.length > 0;
    } catch {
      // User not logged in, so not a member
    }

    return {
      listId: invitation.list_id,
      listName: invitation.list_name,
      invitedByName: invitation.invited_by_name,
      memberCount: parseInt(invitation.member_count),
      isAlreadyMember,
    };
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    return null;
  }
}

export async function acceptInvitationAction(formData: FormData) {
  const user = await requireAuth();
  const code = formData.get("code") as string;

  if (!code) {
    throw new Error("Invitation code is required");
  }

  try {
    // Find the invitation
    const invitationResult = await sql`
      SELECT list_id
      FROM shopping_list_members
      WHERE invitation_code = ${code}
      LIMIT 1
    `;

    if (invitationResult.rows.length === 0) {
      throw new Error("Invalid invitation code");
    }

    const listId = invitationResult.rows[0].list_id;

    // Check if user is already a member
    const existingMember = await sql`
      SELECT 1 FROM shopping_list_members
      WHERE list_id = ${listId}
      AND user_id = ${parseInt(user.id)}
      AND invitation_accepted = true
    `;

    if (existingMember.rows.length > 0) {
      redirect(`/lists/${listId}`);
      return;
    }

    // Add user as a member
    await sql`
      INSERT INTO shopping_list_members (list_id, user_id, invitation_accepted)
      VALUES (${listId}, ${parseInt(user.id)}, true)
      ON CONFLICT (list_id, user_id) 
      DO UPDATE SET invitation_accepted = true
    `;

    redirect(`/lists/${listId}`);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw new Error("Failed to accept invitation");
  }
}