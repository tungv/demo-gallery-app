import type { ReactNode } from "react";

export default function SearchLayout({
  children,
  search,
}: {
  children: ReactNode;
  search: ReactNode;
}) {
  return (
    <>
      {children}
      {search}
    </>
  );
}
