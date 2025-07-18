import { sql } from "@vercel/postgres";

export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create shopping_lists table
    await sql`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        admin_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create shopping_list_members table
    await sql`
      CREATE TABLE IF NOT EXISTS shopping_list_members (
        list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        invitation_code VARCHAR(255),
        invitation_accepted BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (list_id, user_id)
      )
    `;

    // Create shopping_items table
    await sql`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id SERIAL PRIMARY KEY,
        list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        shop_tag VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'to_buy_today', 'bought')),
        marked_by_user_id INTEGER REFERENCES users(id),
        marked_at TIMESTAMP,
        created_by_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create shops table
    await sql`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name, list_id)
      )
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_items_status ON shopping_items(status);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_members_user_id ON shopping_list_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_list_members_invitation_code ON shopping_list_members(invitation_code);
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}