"use client";

import { useSelectedRowsData } from "@/components/ui/grid-list";
import { Hidden, Visible } from "@/components/ui/reserve-layout";

export default function NonEmptySelection({
  minSize = 1,
  children,
}: {
  children: React.ReactNode;
  minSize?: number;
}) {
  const selection = useSelectedRowsData();

  if (selection.length < minSize) {
    return <Hidden>{children}</Hidden>;
  }

  return <Visible>{children}</Visible>;
}
