import { Result } from "@/lib/result";
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
	voteCount: number;
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
				vote_count INTEGER DEFAULT 0,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`;

		// Add vote_count column if it doesn't exist (for existing tables)
		await sql`
			ALTER TABLE people 
			ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0
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
				vote_count,
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
			voteCount: row.vote_count || 0,
			created_at: row.created_at,
		}));
	} catch (error) {
		console.error("Error reading people:", error);
		throw new Error("Failed to read people from database");
	}
}

/**
 * Count all people in database - efficient count using SQL
 */
export async function countAllPeople(): Promise<number> {
	try {
		await ensureTable();
		const result = await sql`
			SELECT COUNT(*) as count FROM people
		`;
		return Number(result.rows[0].count);
	} catch (error) {
		console.error("Error counting people:", error);
		throw new Error("Failed to count people in database");
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
					INSERT INTO people (id, name, email, phone, address, city, state, zip, vote_count, created_at)
					VALUES (
						${person.id}::integer,
						${person.name},
						${person.email},
						${person.phone || ""},
						${person.address || ""},
						${person.city || ""},
						${person.state || ""},
						${person.zip || ""},
						${person.voteCount || 0},
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
			INSERT INTO people (name, email, phone, address, city, state, zip, vote_count, created_at)
			VALUES (
				${person.name},
				${person.email},
				${person.phone || ""},
				${person.address || ""},
				${person.city || ""},
				${person.state || ""},
				${person.zip || ""},
				${person.voteCount || 0},
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

type DeletePersonError =
	| {
			code: "missing_id";
	  }
	| {
			code: "database_error";
			message: string;
			cause: Error;
	  };

type AddPersonError =
	| {
			code: "missing_name";
	  }
	| {
			code: "missing_email";
	  }
	| {
			code: "database_error";
			message: string;
			cause: Error;
	  };

/**
 * Add a new person - business logic
 */
export async function addPersonToStorage(
	newPersonData: NewPersonData,
): Promise<Result<Person, AddPersonError>> {
	if (!newPersonData.name.trim()) {
		return Result.Err({ code: "missing_name" });
	}
	if (!newPersonData.email.trim()) {
		return Result.Err({ code: "missing_email" });
	}

	try {
		await ensureTable();

		const created_at = new Date().toISOString();

		const result = await sql`
			INSERT INTO people (name, email, phone, address, city, state, zip, vote_count, created_at)
			VALUES (
				${newPersonData.name.trim()},
				${newPersonData.email.trim()},
				${newPersonData.phone?.trim() || ""},
				${newPersonData.address?.trim() || ""},
				${newPersonData.city?.trim() || ""},
				${newPersonData.state?.trim() || ""},
				${newPersonData.zip?.trim() || ""},
				0,
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
				vote_count,
				created_at::text
		`;

		const row = result.rows[0];
		return Result.Ok({
			id: row.id,
			name: row.name,
			email: row.email,
			phone: row.phone || "",
			address: row.address || "",
			city: row.city || "",
			state: row.state || "",
			zip: row.zip || "",
			voteCount: row.vote_count || 0,
			created_at: row.created_at,
		});
	} catch (error) {
		console.error("Error adding person:", error);
		return Result.Err({
			code: "database_error",
			message: "Failed to add person",
			cause: error as Error,
		});
	}
}

/**
 * Add multiple people - business logic
 */
export async function addPeopleToStorage(
	newPeopleData: NewPersonData[],
): Promise<Result<Person[], AddPersonError[]>> {
	const addedPeople: Person[] = [];
	const errors: AddPersonError[] = [];

	for (const personData of newPeopleData) {
		const result = await addPersonToStorage(personData);
		result
			.map((person) => addedPeople.push(person))
			.getOrElse((err) => errors.push(err));
	}

	if (errors.length > 0) {
		return Result.Err(errors);
	}

	return Result.Ok(addedPeople);
}

/**
 * Delete a single person by ID - business logic
 */
export async function deletePersonFromStorage(
	id: string,
): Promise<Result<boolean, DeletePersonError>> {
	if (!id.trim()) {
		return Result.Err({ code: "missing_id" });
	}

	try {
		await ensureTable();

		const result = await sql`
			DELETE FROM people 
			WHERE id = ${Number.parseInt(id.trim())}
		`;

		return Result.Ok((result.rowCount ?? 0) > 0);
	} catch (error) {
		console.error("Error deleting person:", error);
		return Result.Err({
			code: "database_error",
			message: "Failed to delete person",
			cause: error as Error,
		});
	}
}

type DeletePeopleError = {
	code: "database_error";
	message: string;
	cause: Error;
};

export async function deletePeopleFromStorage(
	ids: string[],
): Promise<Result<number, DeletePeopleError>> {
	try {
		if (!ids.length) {
			return Result.Ok(0);
		}

		const trimmedIds = ids.map((id) => id.trim()).filter((id) => id);
		if (!trimmedIds.length) {
			return Result.Ok(0);
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

		return Result.Ok(deletedCount);
	} catch (error) {
		console.error("Error deleting people:", error);
		return Result.Err({
			code: "database_error",
			message: "Failed to delete people",
			cause: error as Error,
		});
	}
}

type UpdatePersonError =
	| {
			code: "missing_id";
	  }
	| {
			code: "database_error";
			message: string;
			cause: Error;
	  };

/**
 * update a person by id
 */
export async function updatePersonByIdInStorage(
	id: string,
	person: Partial<Person>,
): Promise<Result<boolean, UpdatePersonError>> {
	if (!id.trim()) {
		return Result.Err({ code: "missing_id" });
	}

	try {
		await ensureTable();

		const result = await sql`
			UPDATE people
			SET
				name = ${person.name},
				email = ${person.email},
				phone = ${person.phone},
				address = ${person.address},
				city = ${person.city},
				state = ${person.state},
				zip = ${person.zip},
				vote_count = ${person.voteCount !== undefined ? person.voteCount : 0}
			WHERE id = ${Number.parseInt(id.trim())}
		`;

		return Result.Ok((result.rowCount ?? 0) > 0);
	} catch (error) {
		console.error("Error updating person:", error);
		return Result.Err({
			code: "database_error",
			message: "Failed to update person",
			cause: error as Error,
		});
	}
}

type IncrementVoteError =
	| {
			code: "missing_id";
	  }
	| {
			code: "database_error";
			message: string;
			cause: Error;
	  };

export async function incrementVoteCountByIdInStorage(
	id: string,
): Promise<Result<boolean, IncrementVoteError>> {
	if (!id.trim()) {
		return Result.Err({ code: "missing_id" });
	}

	try {
		await ensureTable();

		const result = await sql`
			UPDATE people
			SET vote_count = vote_count + 1
			WHERE id = ${Number.parseInt(id.trim())}
		`;

		return Result.Ok((result.rowCount ?? 0) > 0);
	} catch (error) {
		console.error("Error incrementing vote count:", error);
		return Result.Err({
			code: "database_error",
			message: "Failed to increment vote count",
			cause: error as Error,
		});
	}
}
