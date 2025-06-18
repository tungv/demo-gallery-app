import { promises as fs } from "node:fs";
import path from "node:path";

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

const CSV_FILE_PATH = path.join(
	process.cwd(),
	"src/app/interactive-form-in-list/data.csv",
);

/**
 * Parse CSV row to Person object
 */
function csvRowToPerson(row: string): Person {
	// Handle quoted fields and escape sequences
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < row.length) {
		const char = row[i];
		const nextChar = row[i + 1];

		if (char === '"' && !inQuotes) {
			inQuotes = true;
		} else if (char === '"' && inQuotes && nextChar === '"') {
			// Escaped quote
			current += '"';
			i++; // Skip next quote
		} else if (char === '"' && inQuotes) {
			inQuotes = false;
		} else if (char === "," && !inQuotes) {
			fields.push(current);
			current = "";
		} else {
			current += char;
		}
		i++;
	}
	fields.push(current); // Add last field

	return {
		id: fields[0] || "",
		name: fields[1] || "",
		email: fields[2] || "",
		phone: fields[3] || "",
		address: fields[4] || "",
		city: fields[5] || "",
		state: fields[6] || "",
		zip: fields[7] || "",
		created_at: fields[8] || "",
	};
}

/**
 * Convert a person object to CSV row string
 */
function personToCsvRow(person: Person): string {
	const values = [
		person.id,
		`"${person.name.replace(/"/g, '""')}"`,
		person.email,
		person.phone || "",
		`"${(person.address || "").replace(/"/g, '""')}"`,
		person.city || "",
		person.state || "",
		person.zip || "",
		person.created_at || new Date().toISOString(),
	];
	return values.join(",");
}

/**
 * Ensure CSV file exists with headers
 */
async function ensureCsvFile(): Promise<void> {
	try {
		await fs.access(CSV_FILE_PATH);
	} catch {
		// File doesn't exist, create it with headers
		const headers = "id,name,email,phone,address,city,state,zip,created_at";
		await fs.writeFile(CSV_FILE_PATH, headers);
	}
}

/**
 * Generate a unique ID for a new person
 */
export async function generateNextId(): Promise<string> {
	try {
		await ensureCsvFile();
		const content = await fs.readFile(CSV_FILE_PATH, "utf-8");
		const lines = content.trim().split("\n");
		if (lines.length <= 1) return "1"; // Only header exists

		const lastLine = lines[lines.length - 1];
		const lastId = Number.parseInt(lastLine.split(",")[0]);
		return (lastId + 1).toString();
	} catch (error) {
		console.error("Error generating ID:", error);
		return "1";
	}
}

/**
 * Read all people from CSV file
 */
export async function readAllPeople(): Promise<Person[]> {
	try {
		await ensureCsvFile();
		const content = await fs.readFile(CSV_FILE_PATH, "utf-8");
		const lines = content.trim().split("\n");

		// Skip header row
		if (lines.length <= 1) return [];

		return lines
			.slice(1)
			.filter((line) => line.trim())
			.map(csvRowToPerson);
	} catch (error) {
		console.error("Error reading people:", error);
		throw new Error("Failed to read people from CSV file");
	}
}

/**
 * Write all people to CSV file
 */
export async function writeAllPeople(people: Person[]): Promise<void> {
	try {
		const headers = "id,name,email,phone,address,city,state,zip,created_at";
		const csvContent = [headers, ...people.map(personToCsvRow)].join("\n");

		await fs.writeFile(CSV_FILE_PATH, csvContent);
	} catch (error) {
		console.error("Error writing people:", error);
		throw new Error("Failed to write people to CSV file");
	}
}

/**
 * Append a single person to CSV file
 */
export async function appendPerson(person: Person): Promise<void> {
	try {
		const csvRow = personToCsvRow(person);
		await fs.appendFile(CSV_FILE_PATH, `\n${csvRow}`);
	} catch (error) {
		console.error("Error appending person:", error);
		throw new Error("Failed to append person to CSV file");
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

		const id = await generateNextId();
		const created_at = new Date().toISOString();

		const person: Person = {
			id,
			name: newPersonData.name.trim(),
			email: newPersonData.email.trim(),
			phone: newPersonData.phone?.trim() || "",
			address: newPersonData.address?.trim() || "",
			city: newPersonData.city?.trim() || "",
			state: newPersonData.state?.trim() || "",
			zip: newPersonData.zip?.trim() || "",
			created_at,
		};

		await appendPerson(person);
		return person;
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

		const people = await readAllPeople();
		const initialLength = people.length;
		const filteredPeople = people.filter((person) => person.id !== id.trim());

		if (filteredPeople.length === initialLength) {
			// Person not found
			return false;
		}

		await writeAllPeople(filteredPeople);
		return true;
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

		const people = await readAllPeople();
		const initialLength = people.length;
		const filteredPeople = people.filter(
			(person) => !trimmedIds.includes(person.id),
		);

		const deletedCount = initialLength - filteredPeople.length;

		if (deletedCount > 0) {
			await writeAllPeople(filteredPeople);
		}

		return deletedCount;
	} catch (error) {
		console.error("Error deleting people:", error);
		throw new Error("Failed to delete people");
	}
}
