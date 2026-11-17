import { createFileRoute } from "@tanstack/react-router";
import { YourThemesPage } from "@/features/settings-appearance/theme-publish";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/appearance_/themes")({
  validateSearch: searchParams(["page"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <YourThemesPage
      page={Number(page ?? "1") || 1}
      onPage={(next) =>
        void navigate({
          search: (prev) => ({
            ...prev,
            page: next === 1 ? undefined : String(next),
          }),
        })
      }
    />
  );
}
