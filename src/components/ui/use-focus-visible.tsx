import { useSyncExternalStore } from "react";

type Modality = "pointer" | "keyboard" | "virtual";

interface FocusVisibleProps {
  isTextInput?: boolean;
  autoFocus?: boolean;
}

interface FocusVisibleResult {
  isFocusVisible: boolean;
}

// Global state to track modality
let modality: Modality | null = null;
let hasInitialized = false;
const listeners = new Set<() => void>();

// Track if we've focused since the last modality-changing event
let hasFocusedSinceEvent = false;

// Track if we're currently within a text input context
let isTextInputContext = false;

// Keys that should trigger focus visible state
const FOCUS_VISIBLE_KEYS = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Enter",
  " ",
  "Escape",
]);

function onKeyDown(event: KeyboardEvent) {
  // Don't activate focus visible for modifier keys
  if (
    event.key === "Meta" ||
    event.key === "Control" ||
    event.key === "Shift" ||
    event.key === "Alt"
  ) {
    return;
  }

  // Only set modality if it's a navigation key or we're not in a text input
  if (FOCUS_VISIBLE_KEYS.has(event.key) || !isTextInputContext) {
    modality = "keyboard";
    hasFocusedSinceEvent = false;
    notifySubscribers();
  }
}

function onPointerDown() {
  modality = "pointer";
  hasFocusedSinceEvent = false;
  notifySubscribers();
}

function onFocus(event: FocusEvent) {
  const target = event.target as HTMLElement;

  // Check if the focused element is a text input
  if (target && typeof target.matches === "function") {
    const isTextInput = target.matches(
      'input[type="text"], input[type="password"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"], textarea, [contenteditable]',
    );
    isTextInputContext = isTextInput;
  }

  // If focus happens right after a keyboard event, ensure keyboard modality is set
  if (!hasFocusedSinceEvent && modality === "keyboard") {
    hasFocusedSinceEvent = true;
    notifySubscribers();
  }
}

function onWindowFocus() {
  // When returning to the window, default to keyboard modality if we can't determine otherwise
  if (modality == null) {
    modality = "keyboard";
    notifySubscribers();
  }
}

function notifySubscribers() {
  for (const callback of listeners) {
    callback();
  }
}

function subscribe(callback: () => void) {
  if (!hasInitialized) {
    hasInitialized = true;

    // Listen for keyboard events
    window.addEventListener("keydown", onKeyDown, true);

    // Listen for pointer events
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("mousedown", onPointerDown, true);
    window.addEventListener("touchstart", onPointerDown, true);

    // Listen for focus events to track text inputs
    window.addEventListener("focus", onFocus, true);

    // Handle window focus
    window.addEventListener("focus", onWindowFocus);

    // Initialize with keyboard modality by default
    modality = "keyboard";
  }

  listeners.add(callback);

  return () => {
    listeners.delete(callback);

    if (listeners.size === 0) {
      hasInitialized = false;
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("mousedown", onPointerDown, true);
      window.removeEventListener("touchstart", onPointerDown, true);
      window.removeEventListener("focus", onFocus, true);
      window.removeEventListener("focus", onWindowFocus);
    }
  };
}

function getSnapshot() {
  return modality;
}

export function useFocusVisible(
  props: FocusVisibleProps = {},
): FocusVisibleResult {
  const { isTextInput = false, autoFocus = false } = props;
  const currentModality = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "pointer",
  );

  // Update global text input context if this component is a text input
  if (isTextInput) {
    isTextInputContext = true;
  }

  // Handle auto focus case
  if (autoFocus && currentModality === null) {
    // Auto focus should show focus visible
    return { isFocusVisible: true };
  }

  return {
    isFocusVisible: currentModality === "keyboard",
  };
}
