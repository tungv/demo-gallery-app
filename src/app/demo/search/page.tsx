import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";
import { SearchResultsPortalSlot } from "./search-result-portal";
import Dashboard from "./Dashboard";
import {
  NavigationForm,
  NavigationLoadingMessage,
  NavigationSubmitMessage,
} from "@/components/behaviors/navigation-form";
import { ReserveLayout } from "@/components/ui/reserve-layout";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q } = await searchParams;

  const searchTerm = q ? (Array.isArray(q) ? q[0] : q) : "";

  return (
    <div className="min-h-dvh bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
        {/* Header */}
        <header className="bg-white rounded-lg p-6 border shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Search Demo Page</h1>
          <p className="text-gray-600 mt-2">
            Explore our search functionality with popover and parallel routes
          </p>
        </header>

        {/* Search Landmark */}
        <search className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Search</h2>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full max-w-md px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  {searchTerm ? (
                    <span className="text-gray-900">{searchTerm}</span>
                  ) : (
                    <span className="text-gray-500">Search</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[500px] max-h-[600px] overflow-y-auto"
                align="start"
                side="bottom"
                sideOffset={-40}
                alignOffset={0}
                forceMount
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium leading-none">Quick Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your search term or select from recommended searches
                    </p>
                  </div>

                  <NavigationForm
                    action="/demo/search/results"
                    className="grid gap-3"
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        name="q"
                        type="search"
                        placeholder="Type something to search..."
                        autoFocus
                        defaultValue={q}
                      />
                      <Button type="submit" size="sm">
                        <ReserveLayout>
                          <NavigationSubmitMessage>
                            Search
                          </NavigationSubmitMessage>
                          <NavigationLoadingMessage>
                            Searching…
                          </NavigationLoadingMessage>
                        </ReserveLayout>
                      </Button>
                    </div>
                  </NavigationForm>
                  <SearchResultsPortalSlot />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </search>

        <Dashboard />
      </div>
    </div>
  );
}
