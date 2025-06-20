"use server";

import {
	type NewPersonData,
	addPersonToStorage,
	deletePeopleFromStorage,
	deletePersonFromStorage,
	incrementVoteCountByIdInStorage,
} from "./data-store";

// Re-export types for convenience
export type { Person, NewPersonData } from "./data-store";

/**
 * Add a person from form data
 */
export async function addPerson(formData: FormData) {
	try {
		const newPersonData: NewPersonData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			phone: (formData.get("phone") as string) || undefined,
			address: (formData.get("address") as string) || undefined,
			city: (formData.get("city") as string) || undefined,
			state: (formData.get("state") as string) || undefined,
			zip: (formData.get("zip") as string) || undefined,
		};

		return await addPersonToStorage(newPersonData);
	} catch (error) {
		console.error("Error in addPerson action:", error);
		throw error;
	}
}

/**
 * Delete a single person from form data
 */
export async function deletePerson(formData: FormData) {
	try {
		const id = formData.get("id") as string;
		if (!id) {
			throw new Error("Person ID is required");
		}

		return await deletePersonFromStorage(id);
	} catch (error) {
		console.error("Error in deletePerson action:", error);
		throw error;
	}
}

/**
 * Delete a single person by ID (for programmatic use)
 */
export async function deletePersonById(id: string) {
	try {
		return await deletePersonFromStorage(id);
	} catch (error) {
		console.error("Error in deletePersonById action:", error);
		throw error;
	}
}

/**
 * Delete multiple people from form data
 */
export async function deleteBulk(formData: FormData) {
	try {
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
			throw new Error("No person IDs provided");
		}

		return await deletePeopleFromStorage(ids);
	} catch (error) {
		console.error("Error in deleteBulk action:", error);
		throw error;
	}
}

/**
 * Delete multiple people by IDs (for programmatic use)
 */
export async function deletePeopleByIds(ids: string[]) {
	try {
		return await deletePeopleFromStorage(ids);
	} catch (error) {
		console.error("Error in deletePeopleByIds action:", error);
		throw error;
	}
}

/**
 * Increment vote count for a person from form data
 */
export async function incrementVoteCount(formData: FormData) {
	try {
		const id = formData.get("people-list.focused") as string;
		if (!id) {
			return {
				errors: { $: ["Person ID is required"] },
			};
		}

		const success = await incrementVoteCountByIdInStorage(id);

		if (success) {
			return {
				refresh: true,
				result: { success: true },
			};
		}

		return {
			errors: { $: ["Failed to increment vote count"] },
		};
	} catch (error) {
		console.error("Error in incrementVoteCount action:", error);
		return {
			errors: { $: ["An error occurred while incrementing vote count"] },
		};
	}
}

/**
 * Increment vote count for a person by ID (for programmatic use)
 */
export async function incrementVoteCountById(id: string) {
	try {
		return await incrementVoteCountByIdInStorage(id);
	} catch (error) {
		console.error("Error in incrementVoteCountById action:", error);
		throw error;
	}
}
