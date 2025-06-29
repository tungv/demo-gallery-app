interface SearchResultsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResults({
  searchParams,
}: SearchResultsProps) {
  const params = await searchParams;
  const query = params.q as string | undefined;

  if (!query) {
    return null;
  }

  // Simulate search results
  const results = [
    {
      id: 1,
      title: `Result for "${query}" - Item 1`,
      description: "Sample description for the first search result.",
    },
    {
      id: 2,
      title: `Result for "${query}" - Item 2`,
      description: "Sample description for the second search result.",
    },
    {
      id: 3,
      title: `Result for "${query}" - Item 3`,
      description: "Sample description for the third search result.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 bg-white rounded-lg p-6 border">
      <h2 className="text-xl font-semibold">Search Results for "{query}"</h2>
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
