const FOCUSABLE =
	"button, input:not([type='hidden']), select, textarea, a[href], summary, [tabindex], [contenteditable='true']";

/** Re-query on each key press: actions can be disabled, removed, or inserted live. */
export function getFocusableElements(container: Element): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
		(element) => {
			if (
				element.closest(
					"[inert], [hidden], [aria-hidden='true'], [data-disabled='true']",
				)
			) {
				return false;
			}
			if (element.matches(":disabled, [aria-disabled='true']")) return false;
			const style = window.getComputedStyle(element);
			return (
				element.getClientRects().length > 0 &&
				style.visibility !== "hidden" &&
				style.display !== "none"
			);
		},
	);
}

export function getTabbableElements(container: Element): HTMLElement[] {
	return getFocusableElements(container).filter(
		(element) => element.tabIndex >= 0,
	);
}

export function safelyFocusElement(element: Element): boolean {
	if (!(element instanceof HTMLElement)) return false;
	element.focus();
	return document.activeElement === element;
}

/** Keep collapsed-but-mounted rows out of tab order and arrow-key traversal. */
export function isRowVisible(element: HTMLElement): boolean {
	return element.getClientRects().length > 0;
}
