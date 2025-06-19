import { sql } from "@vercel/postgres";

export interface Person {
	id: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	state: string;
	zip: string;
	created_at?: string;
}

/**
 * Initialize the database table if it doesn't exist
 */
async function ensureTable(): Promise<void> {
	try {
		await sql`
			CREATE TABLE IF NOT EXISTS people (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				email VARCHAR(255) NOT NULL,
				phone VARCHAR(50),
				address TEXT,
				city VARCHAR(255),
				state VARCHAR(100),
				zip VARCHAR(20),
				created_at TIMESTAMP DEFAULT NOW()
			)
		`;
	} catch (error) {
		console.error("Error creating table:", error);
		throw new Error("Failed to initialize database table");
	}
}

/**
 * Generate a unique ID for a new person
 */
export async function generateNextId(): Promise<string> {
	try {
		await ensureTable();
		const result = await sql`
			SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM people
		`;
		return result.rows[0].next_id.toString();
	} catch (error) {
		console.error("Error generating ID:", error);
		return "1";
	}
}

/**
 * Read all people from database
 */
export async function readAllPeople(): Promise<Person[]> {
	try {
		await ensureTable();
		const result = await sql`
			SELECT 
				id::text,
				name,
				email,
				phone,
				address,
				city,
				state,
				zip,
				created_at::text
			FROM people 
			ORDER BY id
		`;

		return result.rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			phone: row.phone || "",
			address: row.address || "",
			city: row.city || "",
			state: row.state || "",
			zip: row.zip || "",
			created_at: row.created_at,
		}));
	} catch (error) {
		console.error("Error reading people:", error);
		throw new Error("Failed to read people from database");
	}
}

/**
 * Write all people to database (replaces all existing data)
 */
export async function writeAllPeople(people: Person[]): Promise<void> {
	try {
		await ensureTable();

		// Start transaction
		await sql`BEGIN`;

		try {
			// Clear existing data
			await sql`DELETE FROM people`;

			// Insert new data
			for (const person of people) {
				const createdAt = person.created_at
					? person.created_at
					: new Date().toISOString();
				await sql`
					INSERT INTO people (id, name, email, phone, address, city, state, zip, created_at)
					VALUES (
						${person.id}::integer,
						${person.name},
						${person.email},
						${person.phone || ""},
						${person.address || ""},
						${person.city || ""},
						${person.state || ""},
						${person.zip || ""},
						${createdAt}
					)
				`;
			}

			// Reset sequence to match the highest ID
			if (people.length > 0) {
				const maxId = Math.max(...people.map((p) => Number.parseInt(p.id)));
				await sql`SELECT setval('people_id_seq', ${maxId})`;
			}

			await sql`COMMIT`;
		} catch (error) {
			await sql`ROLLBACK`;
			throw error;
		}
	} catch (error) {
		console.error("Error writing people:", error);
		throw new Error("Failed to write people to database");
	}
}

/**
 * Add a single person to database
 */
export async function appendPerson(person: Person): Promise<void> {
	try {
		await ensureTable();
		const createdAt = person.created_at
			? person.created_at
			: new Date().toISOString();
		await sql`
			INSERT INTO people (name, email, phone, address, city, state, zip, created_at)
			VALUES (
				${person.name},
				${person.email},
				${person.phone || ""},
				${person.address || ""},
				${person.city || ""},
				${person.state || ""},
				${person.zip || ""},
				${createdAt}
			)
		`;
	} catch (error) {
		console.error("Error appending person:", error);
		throw new Error("Failed to add person to database");
	}
}

// Business Logic Functions for Storage Layer

export interface NewPersonData {
	name: string;
	email: string;
	phone?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
}

/**
 * Add a new person - business logic
 */
export async function addPersonToStorage(
	newPersonData: NewPersonData,
): Promise<Person> {
	try {
		// Validate required fields
		if (!newPersonData.name.trim()) {
			throw new Error("Name is required");
		}
		if (!newPersonData.email.trim()) {
			throw new Error("Email is required");
		}

		await ensureTable();

		const created_at = new Date().toISOString();

		const result = await sql`
			INSERT INTO people (name, email, phone, address, city, state, zip, created_at)
			VALUES (
				${newPersonData.name.trim()},
				${newPersonData.email.trim()},
				${newPersonData.phone?.trim() || ""},
				${newPersonData.address?.trim() || ""},
				${newPersonData.city?.trim() || ""},
				${newPersonData.state?.trim() || ""},
				${newPersonData.zip?.trim() || ""},
				${created_at}
			)
			RETURNING 
				id::text,
				name,
				email,
				phone,
				address,
				city,
				state,
				zip,
				created_at::text
		`;

		const row = result.rows[0];
		return {
			id: row.id,
			name: row.name,
			email: row.email,
			phone: row.phone || "",
			address: row.address || "",
			city: row.city || "",
			state: row.state || "",
			zip: row.zip || "",
			created_at: row.created_at,
		};
	} catch (error) {
		console.error("Error adding person:", error);
		throw new Error("Failed to add person");
	}
}

/**
 * Add multiple people - business logic
 */
export async function addPeopleToStorage(
	newPeopleData: NewPersonData[],
): Promise<Person[]> {
	const addedPeople: Person[] = [];

	for (const personData of newPeopleData) {
		const person = await addPersonToStorage(personData);
		addedPeople.push(person);
	}

	return addedPeople;
}

/**
 * Delete a single person by ID - business logic
 */
export async function deletePersonFromStorage(id: string): Promise<boolean> {
	try {
		if (!id.trim()) {
			throw new Error("Person ID is required");
		}

		await ensureTable();

		const result = await sql`
			DELETE FROM people 
			WHERE id = ${Number.parseInt(id.trim())}
		`;

		return (result.rowCount ?? 0) > 0;
	} catch (error) {
		console.error("Error deleting person:", error);
		throw new Error("Failed to delete person");
	}
}

/**
 * Delete multiple people by their IDs - business logic
 */
export async function deletePeopleFromStorage(ids: string[]): Promise<number> {
	try {
		if (!ids.length) {
			return 0;
		}

		const trimmedIds = ids.map((id) => id.trim()).filter((id) => id);
		if (!trimmedIds.length) {
			return 0;
		}

		await ensureTable();

		const numericIds = trimmedIds.map((id) => Number.parseInt(id));

		// Delete each ID individually to work around array parameter limitations
		let deletedCount = 0;
		for (const numericId of numericIds) {
			const result = await sql`
				DELETE FROM people 
				WHERE id = ${numericId}
			`;
			deletedCount += result.rowCount ?? 0;
		}

		return deletedCount;
	} catch (error) {
		console.error("Error deleting people:", error);
		throw new Error("Failed to delete people");
	}
}
