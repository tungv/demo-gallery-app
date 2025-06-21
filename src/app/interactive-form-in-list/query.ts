import { readAllPeople, countAllPeople } from "./data-store";
import type { Person } from "./actions";
import { cache } from "react";

/**
 * Get people with optional limit, sorted by newest first - business logic
 */
export const getPeople = cache(async function getPeople(
	size = 10,
): Promise<Person[]> {
	try {
		const allPeople = await readAllPeople();

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
});

/**
 * Get all people - business logic
 */
export async function getAllPeople(): Promise<Person[]> {
	try {
		return await readAllPeople();
	} catch (error) {
		console.error("Error getting all people:", error);
		throw new Error("Failed to get all people");
	}
}

/**
 * Get a person by ID - business logic
 */
export async function getPersonById(id: string): Promise<Person | null> {
	try {
		if (!id.trim()) {
			return null;
		}

		const allPeople = await readAllPeople();
		return allPeople.find((person) => person.id === id.trim()) || null;
	} catch (error) {
		console.error("Error getting person by ID:", error);
		return null;
	}
}

/**
 * Search people by name or email - business logic
 */
export async function searchPeople(query: string): Promise<Person[]> {
	try {
		if (!query.trim()) {
			return [];
		}

		const allPeople = await readAllPeople();
		const lowercaseQuery = query.toLowerCase().trim();

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
 * Get total count of people - business logic
 */
export async function getPeopleCount(): Promise<number> {
	try {
		const allPeople = await readAllPeople();
		return allPeople.length;
	} catch (error) {
		console.error("Error getting people count:", error);
		return 0;
	}
}

/**
 * Count people - business logic
 */
export async function countPeople(): Promise<number> {
	try {
		return await countAllPeople();
	} catch (error) {
		console.error("Error counting people:", error);
		return 0;
	}
}
