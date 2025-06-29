import { NavigationButton } from "@/components/behaviors/navigation-form";
import {
  GridListContainer,
  GridListContent,
  GridBody,
  GridListRow,
  GridListCell,
  GridListRowHeader,
} from "@/components/ui/grid-list";
import { Search } from "lucide-react";

export default function RecommendedSearches() {
  const RECOMMENDED_SEARCHES = [
    "javascript tutorials",
    "react tutorials",
    "node.js tutorials",
  ];

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h2 className="text-xl font-semibold mb-4">Recommended Searches</h2>

      <GridListContainer selectionMode="none">
        <GridListContent gridClassName="grid grid-cols-[1fr_auto] gap-2 p-1">
          <GridBody>
            {RECOMMENDED_SEARCHES.map((search) => (
              <GridListRow
                key={search}
                rowId={search}
                className="hover:bg-accent p-2 rounded-md focus-visible:outline-2 outline-primary focus-visible:bg-accent items-center"
                asChild
              >
                <NavigationButton
                  searchParams={new URLSearchParams({ q: search })}
                >
                  <GridListRowHeader>{search}</GridListRowHeader>
                  <GridListCell>
                    <Search className="size-4" />
                    <span className="sr-only">Search for {search}</span>
                  </GridListCell>
                </NavigationButton>
              </GridListRow>
            ))}
          </GridBody>
        </GridListContent>
      </GridListContainer>
    </div>
  );
}
