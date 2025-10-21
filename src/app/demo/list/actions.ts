"use server";

import { Result } from "@/lib/result";

import {
	addPersonToStorage,
	deletePersonFromStorage,
	deletePeopleFromStorage,
	incrementVoteCountByIdInStorage,
	type NewPersonData,
} from "./data-store";

// Re-export types for convenience
export type { Person, NewPersonData } from "./data-store";

/**
 * Add a person from form data
 */
export async function addPerson(formData: FormData) {
	const newPersonData: NewPersonData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		phone: (formData.get("phone") as string) || undefined,
		address: (formData.get("address") as string) || undefined,
		city: (formData.get("city") as string) || undefined,
		state: (formData.get("state") as string) || undefined,
		zip: (formData.get("zip") as string) || undefined,
	};

	return addPersonToStorage(newPersonData);
}

/**
 * Delete a single person from form data
 */
export async function deletePerson(formData: FormData) {
	const id = formData.get("id") as string;
	if (!id) {
		return Result.Err({ code: "missing_id" });
	}

	return deletePersonFromStorage(id);
}

/**
 * Delete a single person by ID (for programmatic use)
 */
export async function deletePersonById(id: string) {
	return deletePersonFromStorage(id);
}

/**
 * Delete multiple people from form data
 */
export async function deleteBulk(formData: FormData) {
	const ids: string[] = [];

	// Extract IDs from formData - could be comma-separated or multiple fields
	const idsString = formData.get("ids") as string;
	if (idsString) {
		// Handle comma-separated IDs
		ids.push(
			...idsString
				.split(",")
				.map((id) => id.trim())
				.filter((id) => id),
		);
	}

	// Also check for individual ID fields (id_1, id_2, etc.)
	for (const [key, value] of formData.entries()) {
		if (key.startsWith("id_") && typeof value === "string" && value.trim()) {
			ids.push(value.trim());
		}
	}

	// Check for selectedIds[] array format
	const selectedIds = formData.getAll("selectedIds") as string[];
	if (selectedIds.length > 0) {
		ids.push(...selectedIds.filter((id) => id.trim()));
	}

	if (ids.length === 0) {
		return Result.Err({ code: "missing_ids" });
	}

	return deletePeopleFromStorage(ids);
}

/**
 * Delete multiple people by IDs (for programmatic use)
 */
export async function deletePeopleByIds(ids: string[]) {
	return deletePeopleFromStorage(ids);
}

/**
 * Increment vote count for a person from form data
 */
export async function incrementVoteCount(formData: FormData) {
	const id = formData.get("voting-for") as string;
	if (!id) {
		return Result.Err({ code: "missing_id" });
	}

	return incrementVoteCountByIdInStorage(id);
}

/**
 * Increment vote count for a person by ID (for programmatic use)
 */
export async function incrementVoteCountById(id: string) {
	return incrementVoteCountByIdInStorage(id);
}
