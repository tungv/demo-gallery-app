"use client";

import { useFocusVisible } from "@/components/ui/use-focus-visible";
import { cn } from "@/lib/utils";

export default function FocusVisibleDebugger() {
	const { isFocusVisible } = useFocusVisible();
	return (
		<dl className="w-fit flex flex-row gap-2 items-center">
			<dt>focusVisible</dt>
			<dd>
				<div
					className={cn(
						"size-4 rounded-full",
						isFocusVisible ? "bg-green-500" : "bg-red-500",
					)}
				/>
			</dd>
		</dl>
	);
}
