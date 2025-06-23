"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { useState, useEffect } from "react";

export default function UpdateHighlight({
  value,
  children,
  highlightClassName,
  effectDurationMs = 1000,
  asChild,
  ...spanProps
}: {
  value: string | number;
  children: React.ReactNode;
  highlightClassName: string;
  effectDurationMs?: number;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const [prevValue, setPrevValue] = useState(value);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // reset highlight after
  useEffect(() => {
    if (isHighlighted) {
      const id = setTimeout(() => {
        setIsHighlighted(false);
      }, effectDurationMs);

      return () => clearTimeout(id);
    }
  }, [isHighlighted, effectDurationMs]);

  if (prevValue !== value) {
    setIsHighlighted(true);
    setPrevValue(value);
    console.log("highlighting");
  }

  const highlightProps: React.HTMLAttributes<HTMLSpanElement> = {
    ...spanProps,
    className: cn(spanProps.className, {
      [highlightClassName]: isHighlighted,
    }),
  };

  if (asChild) {
    return <Slot {...highlightProps}>{children}</Slot>;
  }

  return <span {...highlightProps}>{children}</span>;
}
