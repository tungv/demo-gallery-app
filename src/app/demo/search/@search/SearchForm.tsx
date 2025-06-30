import {
  NavigationButton,
  NavigationForm,
  NavigationLoadingMessage,
  NavigationSubmitMessage,
} from "@/components/behaviors/navigation-form";
import { Input } from "@/components/ui/input";
import {
  AutoSubmitField,
  AutoSubmitForm,
} from "@/components/behaviors/auto-submit";
import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import RecommendedSearches from "./results/RecommendedSearches";
import {
  GridBody,
  GridListCell,
  GridListContainer,
  GridListContent,
  GridListRow,
  GridListRowHeader,
  GridListTitle,
} from "@/components/ui/grid-list";
import { Loader2, Search, X } from "lucide-react";

export default function SearchForm({ query }: { query: string }) {
  return (
    <AutoSubmitForm asChild>
      <NavigationForm
        action="/demo/search/results"
        className="grid gap-3"
        preventReset
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <AutoSubmitField triggerPropName="onChange" debounceMs={300}>
            <Input
              name="q"
              type="search"
              placeholder="Type something to search…"
              autoFocus
              className="group-data-loading:motion-safe:animate-pulse"
              defaultValue={query}
            />
          </AutoSubmitField>
          <Button type="submit" size="sm" variant="ghost" className="h-full">
            <ReserveLayout>
              <NavigationSubmitMessage>
                <Search className="size-4" />
                <span className="sr-only">Search</span>
              </NavigationSubmitMessage>
              <NavigationLoadingMessage>
                <Loader2 className="size-4 motion-safe:animate-spin reduce-motion:pulse" />
                <span className="sr-only">Searching…</span>
              </NavigationLoadingMessage>
            </ReserveLayout>
          </Button>
        </div>

        {query ? <SearchResults keyword={query} /> : <RecommendedSearches />}
      </NavigationForm>
    </AutoSubmitForm>
  );
}

function SearchResults({ keyword }: { keyword: string }) {
  // Simulate search results
  const results = [
    {
      id: 1,
      title: `Result 1 for "${keyword}"`,
      description: "Sample description for the first search result.",
    },
    {
      id: 2,
      title: `Result 2 for "${keyword}"`,
      description: "Sample description for the second search result.",
    },
    {
      id: 3,
      title: `Result 3 for "${keyword}"`,
      description: "Sample description for the third search result.",
    },
  ];

  return (
    <GridListContainer className="@container grid grid-cols-1 gap-4 bg-white rounded-lg p-2 border">
      <header className="grid grid-cols-[1fr_auto] gap-2">
        <GridListTitle className="text-lg font-semibold tracking-tight">
          Search Results for &quot;{keyword}&quot;
        </GridListTitle>

        <NavigationButton formAction="/demo/search" asChild>
          <Button variant="ghost" size="sm" className="text-foreground/60">
            <X className="size-4" />
            Clear Search
          </Button>
        </NavigationButton>
      </header>

      <GridListContent gridClassName="grid grid-cols-1 @2xl:grid-cols-[1fr_auto] gap-4">
        <GridBody className="gap-y-2 p-1">
          {results.map((result) => (
            <GridListRow
              key={result.id}
              className="border rounded-md p-2 @2xl:p-4 items-center focus-visible:outline-2 outline-primary"
            >
              <GridListRowHeader className="whitespace-nowrap">
                {result.title}
              </GridListRowHeader>
              <GridListCell className="text-foreground/80">
                {result.description}
              </GridListCell>
            </GridListRow>
          ))}
        </GridBody>
      </GridListContent>
    </GridListContainer>
  );
}
