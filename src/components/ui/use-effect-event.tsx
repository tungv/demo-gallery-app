import { useCallback } from "react";

import { useEffect } from "react";

import { useRef } from "react";

type VoidFunction = (...args: unknown[]) => void;

export default function useEffectEvent<T extends VoidFunction>(fn: T): T {
	const ref = useRef<T>(fn);

	useEffect(() => {
		ref.current = fn;
	}, [fn]);

	const t = useCallback((...args: Parameters<T>): void => {
		ref.current(...args);
	}, []) as T;

	return t;
}
