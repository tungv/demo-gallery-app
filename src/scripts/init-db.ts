import { initializeDatabase } from "../lib/db/schema";

async function main() {
  console.log("Initializing database...");
  
  try {
    await initializeDatabase();
    console.log("Database initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

main();