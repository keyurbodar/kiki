import { createFileRoute } from "@tanstack/react-router";
import { IssuesPage } from "@/features/issues/issues-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/issues")({
  validateSearch: searchParams(["pane"]),
  component: IssuesPage,
});
