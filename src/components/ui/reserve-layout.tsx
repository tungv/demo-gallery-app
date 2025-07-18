"use client";

import type { ReactNode } from "react";

interface ReserveLayoutProps {
  children: ReactNode;
}

export function Hidden({ children }: ReserveLayoutProps) {
  return (
    <div aria-hidden="true" className="invisible">
      {children}
    </div>
  );
}

export function Visible({ children }: ReserveLayoutProps) {
  return <>{children}</>;
}
