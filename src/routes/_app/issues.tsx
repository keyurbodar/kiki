import { createFileRoute } from "@tanstack/react-router";
import { IssuesPage } from "@/features/issues/issues-page";
import { pageTitle } from "@/lib/page-title";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/issues")({
  head: () => ({ meta: [{ title: pageTitle("Issues") }] }),
  validateSearch: searchParams(["pane"]),
  component: IssuesPage,
});
