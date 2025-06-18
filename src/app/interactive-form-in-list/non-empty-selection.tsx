"use client";

import { useSelectedRows } from "@/components/ui/grid-list";
import { Hidden, Visible } from "@/components/ui/reserve-layout";

export default function NonEmptySelection({
  minSize = 1,
  children,
}: {
  children: React.ReactNode;
  minSize?: number;
}) {
  const selection = useSelectedRows();

  if (selection.size < minSize) {
    return <Hidden>{children}</Hidden>;
  }

  return <Visible>{children}</Visible>;
}
