import { sql } from "@vercel/postgres";
import { cache } from "react";
import type { ShoppingItem, Shop } from "@/lib/types";

export interface ListDetails {
  id: string;
  name: string;
  adminUserId: string;
  isAdmin: boolean;
  memberCount: number;
  members: {
    userId: string;
    name: string;
    isAdmin: boolean;
  }[];
}

export const getListDetails = cache(async function getListDetails(
  listId: string,
  userId: string
): Promise<ListDetails | null> {
  try {
    // Check if user has access to this list
    const accessCheck = await sql`
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = ${parseInt(listId)}
      AND (
        sl.admin_user_id = ${parseInt(userId)}
        OR EXISTS (
          SELECT 1 FROM shopping_list_members slm
          WHERE slm.list_id = sl.id 
          AND slm.user_id = ${parseInt(userId)}
          AND slm.invitation_accepted = true
        )
      )
    `;

    if (accessCheck.rows.length === 0) {
      return null;
    }

    // Get list details
    const listResult = await sql`
      SELECT 
        id::text,
        name,
        admin_user_id::text
      FROM shopping_lists
      WHERE id = ${parseInt(listId)}
    `;

    if (listResult.rows.length === 0) {
      return null;
    }

    const list = listResult.rows[0];

    // Get members
    const membersResult = await sql`
      SELECT 
        u.id::text as user_id,
        u.name,
        CASE WHEN sl.admin_user_id = u.id THEN true ELSE false END as is_admin
      FROM users u
      JOIN shopping_list_members slm ON u.id = slm.user_id
      JOIN shopping_lists sl ON slm.list_id = sl.id
      WHERE slm.list_id = ${parseInt(listId)} 
      AND slm.invitation_accepted = true
      ORDER BY is_admin DESC, u.name
    `;

    return {
      id: list.id,
      name: list.name,
      adminUserId: list.admin_user_id,
      isAdmin: list.admin_user_id === userId,
      memberCount: membersResult.rows.length,
      members: membersResult.rows.map(row => ({
        userId: row.user_id,
        name: row.name,
        isAdmin: row.is_admin,
      })),
    };
  } catch (error) {
    console.error("Error fetching list details:", error);
    return null;
  }
});

export const getListItems = cache(async function getListItems(
  listId: string
): Promise<ShoppingItem[]> {
  try {
    const result = await sql`
      SELECT 
        si.id::text,
        si.list_id::text,
        si.name,
        si.shop_tag,
        si.notes,
        si.status,
        si.marked_by_user_id::text,
        si.marked_at::text,
        si.created_by_user_id::text,
        si.created_at::text,
        si.updated_at::text,
        u.name as created_by_name,
        mu.name as marked_by_name
      FROM shopping_items si
      LEFT JOIN users u ON si.created_by_user_id = u.id
      LEFT JOIN users mu ON si.marked_by_user_id = mu.id
      WHERE si.list_id = ${parseInt(listId)}
      AND si.status != 'bought'
      ORDER BY 
        CASE si.status 
          WHEN 'to_buy_today' THEN 1
          WHEN 'active' THEN 2
          ELSE 3
        END,
        si.created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.id,
      list_id: row.list_id,
      name: row.name,
      shop_tag: row.shop_tag,
      notes: row.notes,
      status: row.status as 'active' | 'to_buy_today' | 'bought',
      marked_by_user_id: row.marked_by_user_id,
      marked_at: row.marked_at,
      created_by_user_id: row.created_by_user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      createdByName: row.created_by_name,
      markedByName: row.marked_by_name,
    }));
  } catch (error) {
    console.error("Error fetching list items:", error);
    return [];
  }
});

export const getListShops = cache(async function getListShops(
  listId: string
): Promise<Shop[]> {
  try {
    const result = await sql`
      SELECT 
        id::text,
        name,
        list_id::text,
        created_at::text
      FROM shops
      WHERE list_id = ${parseInt(listId)}
      ORDER BY name
    `;

    return result.rows as Shop[];
  } catch (error) {
    console.error("Error fetching shops:", error);
    return [];
  }
});