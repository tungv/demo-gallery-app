import SearchForm from "../SearchForm";

interface SearchResultsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchResultsPage({
  searchParams,
}: SearchResultsProps) {
  const params = await searchParams;
  const query = params.q
    ? Array.isArray(params.q)
      ? params.q[0]
      : params.q
    : "";

  return <SearchForm query={query} />;
}
