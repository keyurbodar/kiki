import { createFileRoute } from "@tanstack/react-router";
import { ThreadsPage } from "@/features/threads/threads-page";
import { pageTitle } from "@/lib/page-title";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/threads")({
  head: () => ({ meta: [{ title: pageTitle("Threads") }] }),
  validateSearch: searchParams(["automation", "project", "thread"]),
  component: ThreadsPage,
});
