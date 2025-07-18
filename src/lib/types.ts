export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListMember {
  list_id: string;
  user_id: string;
  joined_at: string;
  invitation_code?: string;
  invitation_accepted: boolean;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  shop_tag?: string;
  notes?: string;
  status: 'active' | 'to_buy_today' | 'bought';
  marked_by_user_id?: string;
  marked_at?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  createdByName?: string;
  markedByName?: string;
}

export interface Shop {
  id: string;
  name: string;
  list_id: string;
  created_at: string;
}