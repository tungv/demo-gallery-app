"use server";

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

export interface NewPersonData {
	name: string;
	email: string;
	phone?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
}

const CSV_FILE_PATH = path.join(
	process.cwd(),
	"src/app/interactive-form-in-list/data.csv",
);

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
async function generateId(): Promise<string> {
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
 * Add a new person to the CSV file
 */
export async function addPerson(newPersonData: NewPersonData): Promise<Person> {
	try {
		const id = await generateId();
		const created_at = new Date().toISOString();

		const person: Person = {
			id,
			name: newPersonData.name,
			email: newPersonData.email,
			phone: newPersonData.phone || "",
			address: newPersonData.address || "",
			city: newPersonData.city || "",
			state: newPersonData.state || "",
			zip: newPersonData.zip || "",
			created_at,
		};

		const csvRow = personToCsvRow(person);
		await fs.appendFile(CSV_FILE_PATH, `\n${csvRow}`);

		return person;
	} catch (error) {
		console.error("Error adding person:", error);
		throw new Error("Failed to add person to CSV file");
	}
}

/**
 * Add multiple people to the CSV file
 */
export async function addPeople(
	newPeopleData: NewPersonData[],
): Promise<Person[]> {
	const addedPeople: Person[] = [];

	for (const personData of newPeopleData) {
		const person = await addPerson(personData);
		addedPeople.push(person);
	}

	return addedPeople;
}
