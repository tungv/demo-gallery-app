// Helper function to check if an element is actually visible and interactable
function isElementVisible(element: HTMLElement): boolean {
	if (element.offsetParent === null) return false;

	const style = window.getComputedStyle(element);
	if (style.display === "none" || style.visibility === "hidden") return false;
	if (style.opacity === "0") return false;

	return true;
}

// Helper function to check if an element is inert or disabled
function isElementInert(element: HTMLElement): boolean {
	// Check for inert attribute (HTML5)
	if (element.hasAttribute("inert")) return true;

	// Check for disabled
	if (element.hasAttribute("disabled")) return true;

	// Check for aria-disabled
	if (element.getAttribute("aria-disabled") === "true") return true;

	// Check for aria-hidden
	if (element.getAttribute("aria-hidden") === "true") return true;

	// Check if parent has inert
	let parent = element.parentElement;
	while (parent) {
		if (parent.hasAttribute("inert")) return true;
		parent = parent.parentElement;
	}

	return false;
}

// Helper function to check if an element is a sentinel (focus management element)
function isElementSentinel(element: HTMLElement): boolean {
	// Common sentinel attributes used for focus management
	const sentinelAttributes = ["data-focus-scope-sentinel"];

	return sentinelAttributes.some((attr) => element.hasAttribute(attr));
}

// Helper function to determine if an element is tabbable
function isElementTabbable(element: HTMLElement): boolean {
	// Check if it's a sentinel element first - these should always be tabbable
	if (isElementSentinel(element)) {
		return true;
	}

	if (isElementInert(element)) {
		return false;
	}

	// For non-sentinel elements, check visibility
	if (!isElementVisible(element)) {
		return false;
	}

	const tabIndex = element.tabIndex;

	// Elements with tabindex="-1" are not tabbable
	if (tabIndex === -1) return false;

	// Elements with explicit positive tabindex are tabbable
	if (tabIndex > 0) return true;

	const tagName = element.tagName.toLowerCase();

	// Form controls
	if (["input", "select", "textarea", "button"].includes(tagName)) {
		return true;
	}

	// Links with href
	if (tagName === "a" && element.hasAttribute("href")) {
		return true;
	}

	// Interactive elements
	if (["details", "summary"].includes(tagName)) {
		return true;
	}

	// Contenteditable elements
	if (element.isContentEditable) {
		return true;
	}

	// Elements with explicit tabindex="0"
	if (tabIndex === 0) return true;

	return false;
}

// Performance cache for tabbable elements
const tabbableCache = new WeakMap<
	Element,
	{ elements: HTMLElement[]; timestamp: number }
>();
const CACHE_DURATION = 1000; // 1 second cache

// Lightweight version for performance-critical scenarios
export function getTabbableElementsLight(container: Element): HTMLElement[] {
	// Use simple querySelector approach for better performance
	const selectors = [
		"button:not([disabled]):not([inert])",
		"input:not([disabled]):not([inert])",
		"select:not([disabled]):not([inert])",
		"textarea:not([disabled]):not([inert])",
		"a[href]:not([inert])",
		'[tabindex]:not([tabindex="-1"]):not([inert])',
		"details:not([inert])",
		"summary:not([inert])",
		'[contenteditable="true"]:not([inert])',
		"[data-focus-scope-start]",
		"[data-focus-scope-end]",
		"[data-focus-guard]",
		"[data-focus-sentinel]",
	].join(",");

	const elements = Array.from(
		container.querySelectorAll(selectors),
	) as HTMLElement[];

	// Quick visibility filter
	return elements.filter((el) => {
		// Always include sentinels
		if (isElementSentinel(el)) return true;

		// Quick visibility check
		return el.offsetParent !== null || el.tagName === "AREA";
	});
}

// Heavy but comprehensive version with optimizations
export function getTabbableElements(
	container: Element,
	useCache = true,
): HTMLElement[] {
	// Check cache first
	if (useCache) {
		const cached = tabbableCache.get(container);
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			return cached.elements;
		}
	}

	const tabbableElements: HTMLElement[] = [];
	const processedShadowRoots = new Set<ShadowRoot>();

	// Use TreeWalker to traverse all nodes including shadow DOM
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
		acceptNode(node: Node): number {
			const element = node as HTMLElement;

			// Check if this element is tabbable
			if (isElementTabbable(element)) {
				return NodeFilter.FILTER_ACCEPT;
			}

			// Continue traversing even if this element isn't tabbable
			return NodeFilter.FILTER_SKIP;
		},
	});

	let currentNode = walker.nextNode();
	while (currentNode) {
		tabbableElements.push(currentNode as HTMLElement);
		currentNode = walker.nextNode();
	}

	// Also traverse shadow roots (optimized to avoid duplicates)
	const shadowHosts = container.querySelectorAll("*");
	for (const host of shadowHosts) {
		if (host.shadowRoot && !processedShadowRoots.has(host.shadowRoot)) {
			processedShadowRoots.add(host.shadowRoot);
			const shadowTabbableElements = getTabbableElements(
				host.shadowRoot as unknown as Element,
				false,
			);
			tabbableElements.push(...shadowTabbableElements);
		}
	}

	// Sort by tab order (tabindex values, then document order)
	const sortedElements = tabbableElements.sort((a, b) => {
		const aTabIndex = a.tabIndex;
		const bTabIndex = b.tabIndex;

		// Elements with positive tabindex come first, sorted by tabindex value
		if (aTabIndex > 0 && bTabIndex > 0) {
			return aTabIndex - bTabIndex;
		}
		if (aTabIndex > 0) return -1;
		if (bTabIndex > 0) return 1;

		// Elements with tabindex 0 or default tab order, sorted by document order
		return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
			? -1
			: 1;
	});

	// Cache the result
	if (useCache) {
		tabbableCache.set(container, {
			elements: sortedElements,
			timestamp: Date.now(),
		});
	}

	return sortedElements;
}

export function safelyFocusElement(element: Element): boolean {
	if (element instanceof HTMLElement && element.focus) {
		element.focus();
		return true;
	}

	return false;
}
