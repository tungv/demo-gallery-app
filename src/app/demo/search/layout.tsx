import type { ReactNode } from "react";
import {
  SearchResultsPortalProvider,
  SearchResultsPortalContent,
} from "./search-result-portal";

export default function SearchLayout({
  children,
  search,
}: {
  children: ReactNode;
  search: ReactNode;
}) {
  return (
    <SearchResultsPortalProvider>
      {children}
      <SearchResultsPortalContent>{search}</SearchResultsPortalContent>
    </SearchResultsPortalProvider>
  );
}
