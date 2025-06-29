"use client";

import { createPortalContext } from "@/utils/portal";

const [
  SearchResultsPortalProvider,
  SearchResultsPortalSlot,
  SearchResultsPortalContent,
] = createPortalContext("SearchResultsPortal");

export {
  SearchResultsPortalProvider,
  SearchResultsPortalSlot,
  SearchResultsPortalContent,
};
