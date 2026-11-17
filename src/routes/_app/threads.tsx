import { createFileRoute } from "@tanstack/react-router";
import { ThreadsPage } from "@/features/threads/threads-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/threads")({
  validateSearch: searchParams(["automation", "project", "thread"]),
  component: ThreadsPage,
});
