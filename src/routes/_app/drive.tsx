import { createFileRoute } from "@tanstack/react-router";
import { DrivePage } from "@/features/drive/drive-page";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/drive")({
  head: () => ({ meta: [{ title: pageTitle("Capy Drive") }] }),
  component: DrivePage,
});
