import { createFileRoute } from "@tanstack/react-router";
import { DitherCoverPage } from "@/features/promotions/dither-cover";

export const Route = createFileRoute("/dither-cover")({
  validateSearch: (search: Record<string, unknown>) => ({
    theme: search.theme === "dark" ? ("dark" as const) : ("light" as const),
    at: typeof search.at === "number" ? search.at : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { theme, at } = Route.useSearch();
  return <DitherCoverPage theme={theme} at={at} />;
}
