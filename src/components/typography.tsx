"use client";

import { cn } from "@/lib/utils";

export function Title({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h1 className={cn("text-4xl font-bold tracking-tight", className)}>
			{children}
		</h1>
	);
}

export function Subtitle({ children }: { children: React.ReactNode }) {
	return <h2 className="text-2xl font-bold tracking-tight">{children}</h2>;
}
