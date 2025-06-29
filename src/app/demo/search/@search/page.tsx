import Link from "next/link";

interface SearchResultsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResultsPage({
  searchParams,
}: SearchResultsProps) {
  const params = await searchParams;
  const query = params.q as string | undefined;

  if (!query) {
    return <RecommendedSearches />;
  }

  return <SearchResults keyword={query} />;
}

function RecommendedSearches() {
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
          <Link href={`/demo/search?q=${search}`} key={search}>
            {search}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchResults({ keyword }: { keyword: string }) {
  // Simulate search results
  const results = [
    {
      id: 1,
      title: `Result for "${keyword}" - Item 1`,
      description: "Sample description for the first search result.",
    },
    {
      id: 2,
      title: `Result for "${keyword}" - Item 2`,
      description: "Sample description for the second search result.",
    },
    {
      id: 3,
      title: `Result for "${keyword}" - Item 3`,
      description: "Sample description for the third search result.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 bg-white rounded-lg p-6 border">
      <h2 className="text-xl font-semibold">
        Search Results for &quot;{keyword}&quot;
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-4 border rounded-md hover:bg-gray-50"
          >
            <h3 className="font-medium text-gray-900">{result.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{result.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
