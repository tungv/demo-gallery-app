"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const RECOMMENDED_SEARCHES = [
  "javascript tutorials",
  "react components",
  "css animations",
  "web development",
  "typescript guide",
];

const DASHBOARD_STATS = [
  { label: "Total Users", value: "12,543", icon: Users, change: "+12.5%" },
  { label: "Revenue", value: "$45,231", icon: TrendingUp, change: "+8.2%" },
  { label: "Orders", value: "1,247", icon: ShoppingCart, change: "+5.4%" },
];

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ id: number; title: string; description: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (term: string) => {
    if (term.trim()) {
      setIsSearching(true);
      setHasSearched(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate search results
      const results = [
        {
          id: 1,
          title: `Result for "${term.trim()}" - Item 1`,
          description: "Sample description for the first search result.",
        },
        {
          id: 2,
          title: `Result for "${term.trim()}" - Item 2`,
          description: "Sample description for the second search result.",
        },
        {
          id: 3,
          title: `Result for "${term.trim()}" - Item 3`,
          description: "Sample description for the third search result.",
        },
      ];

      setSearchResults(results);
      setIsSearching(false);

      // Still update URL for sharing/bookmarking
      router.push(`/demo/search?q=${encodeURIComponent(term.trim())}`, {
        scroll: false,
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

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
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full max-w-md px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  <span
                    className={`flex-1 ${
                      searchTerm ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {searchTerm || "Search..."}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[500px] max-h-[600px] overflow-y-auto"
                align="start"
                side="bottom"
                sideOffset={-40}
                alignOffset={0}
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium leading-none">Quick Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your search term or select from recommended searches
                    </p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="grid gap-3">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        type="search"
                        placeholder="Type something to search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" size="sm" disabled={isSearching}>
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </form>

                  {!hasSearched && (
                    <div className="grid gap-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Recommended Searches
                      </h4>
                      <div className="grid gap-1">
                        {RECOMMENDED_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handleSearch(term)}
                            className="text-left p-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results in Popover */}
                  {hasSearched && (
                    <div className="grid gap-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                          {isSearching
                            ? "Searching..."
                            : `Results (${searchResults.length})`}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setHasSearched(false);
                            setSearchResults([]);
                            setSearchTerm("");
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          New Search
                        </button>
                      </div>

                      {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        </div>
                      ) : (
                        <div className="grid gap-2 max-h-64 overflow-y-auto">
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                            >
                              <h5 className="font-medium text-gray-900 text-sm">
                                {result.title}
                              </h5>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {result.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </search>

        {/* Sample Dashboard */}
        <section className="bg-white rounded-lg p-6 border shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sample Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DASHBOARD_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">New user registration</span>
                <span className="text-gray-500">2 minutes ago</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order #12345 completed</span>
                <span className="text-gray-500">5 minutes ago</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment processed</span>
                <span className="text-gray-500">8 minutes ago</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
