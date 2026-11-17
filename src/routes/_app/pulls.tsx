import { createFileRoute } from "@tanstack/react-router";
import { PullsPage } from "@/features/pulls/pulls-page";

export const Route = createFileRoute("/_app/pulls")({
  component: PullsPage,
});
