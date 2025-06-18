"use server";

export async function bulkDeleteAction(formData: FormData) {
	"use server";
	console.log("delete", formData.getAll("multiple-selection"));
}
