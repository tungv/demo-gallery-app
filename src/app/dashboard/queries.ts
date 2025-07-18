import { sql } from "@vercel/postgres";
import { cache } from "react";

export interface UserList {
  id: string;
  name: string;
  itemCount: number;
  memberCount: number;
  isAdmin: boolean;
}

export const getUserLists = cache(async function getUserLists(
  userId: string
): Promise<UserList[]> {
  try {
    const result = await sql`
      SELECT 
        sl.id::text,
        sl.name,
        sl.admin_user_id::text,
        COUNT(DISTINCT si.id) as item_count,
        COUNT(DISTINCT slm.user_id) as member_count
      FROM shopping_lists sl
      LEFT JOIN shopping_list_members slm ON sl.id = slm.list_id
      LEFT JOIN shopping_items si ON sl.id = si.list_id AND si.status != 'bought'
      WHERE sl.id IN (
        SELECT list_id 
        FROM shopping_list_members 
        WHERE user_id = ${parseInt(userId)} AND invitation_accepted = true
      )
      OR sl.admin_user_id = ${parseInt(userId)}
      GROUP BY sl.id, sl.name, sl.admin_user_id
      ORDER BY sl.created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      itemCount: parseInt(row.item_count) || 0,
      memberCount: parseInt(row.member_count) || 0,
      isAdmin: row.admin_user_id === userId,
    }));
  } catch (error) {
    console.error("Error fetching user lists:", error);
    return [];
  }
});