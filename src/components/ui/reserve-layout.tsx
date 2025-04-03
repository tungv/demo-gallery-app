"use client";

import { cn } from "@/lib/utils";
import { createContext, useContext } from "react";
import type { ComponentProps } from "react";
const ReserveLayoutContext = createContext(false);

/**
 * Utility component for avoiding layout shifts when swapping different contents
 *
 * ## Anatomy
 *
 * ```jsx
 * <ReserveLayout>
 *   <Hidden>
 *     <span>Content</span>
 *   </Hidden>
 *   <Visible>
 *     <span>Content</span>
 *   </Visible>
 * </ReserveLayout>
 * ```
 *
 */

export function ReserveLayout({
  children,
  className,
  placeItems = "center",
  ...divProps
}: ComponentProps<"div"> & {
  placeItems?: "start" | "center" | "end" | "stretch" | "baseline";
}) {
  return (
    <ReserveLayoutContext.Provider value={true}>
      <div
        {...divProps}
        className={cn(className, "pile", {
          "place-items-baseline": placeItems === "baseline",
          "place-items-start": placeItems === "start",
          "place-items-center": placeItems === "center",
          "place-items-end": placeItems === "end",
          "place-items-stretch": placeItems === "stretch",
        })}
      >
        {children}
      </div>
    </ReserveLayoutContext.Provider>
  );
}

export function Hidden({
  children,
  className,
  ...spanProps
}: ComponentProps<"span">) {
  const isReserveLayout = useContext(ReserveLayoutContext);
  return isReserveLayout ? (
    <span
      {...spanProps}
      className={cn(className, "invisible")}
      aria-hidden
      tabIndex={-1}
    >
      {children}
    </span>
  ) : null;
}

export function Visible({
  children,
  className,
  ...spanProps
}: ComponentProps<"span">) {
  const isReserveLayout = useContext(ReserveLayoutContext);
  return isReserveLayout ? (
    <span {...spanProps} className={cn(className, "visible")}>
      {children}
    </span>
  ) : (
    children
  );
}
