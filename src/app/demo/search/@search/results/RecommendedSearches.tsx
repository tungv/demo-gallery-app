import { NavigationButton } from "@/components/behaviors/navigation-form";

export default function RecommendedSearches() {
  const RECOMMENDED_SEARCHES = [
    "javascript tutorials",
    "react tutorials",
    "node.js tutorials",
  ];
  return (
    <div className="grid grid-cols-1 gap-4 bg-white rounded-lg p-6 border">
      <h2 className="text-xl font-semibold">Recommended Searches</h2>

      <div className="grid grid-cols-1 gap-3">
        {RECOMMENDED_SEARCHES.map((search) => (
          <NavigationButton
            searchParams={new URLSearchParams({ q: search })}
            key={search}
          >
            {search}
          </NavigationButton>
        ))}
      </div>
    </div>
  );
}
