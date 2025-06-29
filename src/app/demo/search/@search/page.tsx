import { NavigationForm } from "@/components/behaviors/navigation-form";
import RecommendedSearches from "./results/RecommendedSearches";

export default function DefaultSearch() {
  return (
    <NavigationForm action="/demo/search/results">
      <RecommendedSearches />
    </NavigationForm>
  );
}
