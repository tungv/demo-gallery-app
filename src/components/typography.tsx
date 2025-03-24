"use client";

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold tracking-tight">{children}</h1>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-tight">{children}</h2>;
}
