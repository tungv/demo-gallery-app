// Helper function to get all tabbable elements
export function getTabbableElements(container: Element): HTMLElement[] {
	const tabbableSelectors = [
		"button:not([disabled])",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		"a[href]",
		'[tabindex]:not([tabindex="-1"])',
		"details",
		"summary",
		"[data-focus-scope-start]",
		"[data-focus-scope-end]",
	].join(",");

	const elements = Array.from(
		container.querySelectorAll(tabbableSelectors),
	) as HTMLElement[];

	return elements.filter((el) => {
		if (
			el.hasAttribute("data-focus-scope-start") ||
			el.hasAttribute("data-focus-scope-end")
		) {
			return true;
		}

		const tabIndex = el.getAttribute("tabindex");
		return tabIndex !== "-1" && el.offsetParent !== null;
	});
}

// Helper function to get all tabbable elements on the page
export function getAllTabbableElements(): HTMLElement[] {
	return getTabbableElements(document.body) as HTMLElement[];
}

export function safelyFocusElement(element: Element): boolean {
	if (element instanceof HTMLElement && element.focus) {
		element.focus();
		return true;
	}

	return false;
}
