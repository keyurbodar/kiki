import { createFileRoute } from "@tanstack/react-router";
import { PullsPage } from "@/features/pulls/pulls-page";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/pulls")({
  head: () => ({ meta: [{ title: pageTitle("Pull requests") }] }),
  component: PullsPage,
});
