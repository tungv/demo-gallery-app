import { promises as fs } from "node:fs";
import path from "node:path";
import type { Person } from "./actions";

const CSV_FILE_PATH = path.join(
	process.cwd(),
	"src/app/interactive-form-in-list/data.csv",
);

/**
 * Parse a CSV row into a Person object
 */
function csvRowToPerson(row: string): Person {
	// Simple CSV parser that handles quoted values
	const values: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];

		if (char === '"') {
			if (inQuotes && row[i + 1] === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			values.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	values.push(current); // Add the last value

	return {
		id: values[0] || "",
		name: values[1] || "",
		email: values[2] || "",
		phone: values[3] || "",
		address: values[4] || "",
		city: values[5] || "",
		state: values[6] || "",
		zip: values[7] || "",
		created_at: values[8] || "",
	};
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
 * Read all people from the CSV file
 */
export async function getAllPeople(): Promise<Person[]> {
	try {
		await ensureCsvFile();
		const content = await fs.readFile(CSV_FILE_PATH, "utf-8");
		const lines = content.trim().split("\n");

		if (lines.length <= 1) {
			return []; // Only headers or empty file
		}

		// Skip the header row and parse data rows
		const people = lines.slice(1).map((line) => csvRowToPerson(line));

		return people;
	} catch (error) {
		console.error("Error reading people from CSV:", error);
		throw new Error("Failed to read people from CSV file");
	}
}

/**
 * Get people with optional limit, sorted by newest first
 */
export async function getPeople(size = 10): Promise<Person[]> {
	try {
		const allPeople = await getAllPeople();

		// Sort by created_at descending (newest first)
		const sortedPeople = allPeople.toSorted((a, b) => {
			const dateA = new Date(a.created_at || "1970-01-01").getTime();
			const dateB = new Date(b.created_at || "1970-01-01").getTime();
			return dateB - dateA;
		});

		// Return the requested number of people
		return sortedPeople.slice(0, size);
	} catch (error) {
		console.error("Error getting people:", error);
		throw new Error("Failed to get people");
	}
}

/**
 * Get a person by ID
 */
export async function getPersonById(id: string): Promise<Person | null> {
	try {
		const allPeople = await getAllPeople();
		return allPeople.find((person) => person.id === id) || null;
	} catch (error) {
		console.error("Error getting person by ID:", error);
		return null;
	}
}

/**
 * Search people by name or email
 */
export async function searchPeople(query: string): Promise<Person[]> {
	try {
		const allPeople = await getAllPeople();
		const lowercaseQuery = query.toLowerCase();

		return allPeople.filter(
			(person) =>
				person.name.toLowerCase().includes(lowercaseQuery) ||
				person.email.toLowerCase().includes(lowercaseQuery),
		);
	} catch (error) {
		console.error("Error searching people:", error);
		throw new Error("Failed to search people");
	}
}

/**
 * Get total count of people
 */
export async function getPeopleCount(): Promise<number> {
	try {
		const allPeople = await getAllPeople();
		return allPeople.length;
	} catch (error) {
		console.error("Error getting people count:", error);
		return 0;
	}
}
