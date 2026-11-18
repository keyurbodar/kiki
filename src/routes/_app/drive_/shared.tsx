import { createFileRoute } from "@tanstack/react-router";
import { SharedPage } from "@/features/drive/drive-page";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/drive_/shared")({
  head: () => ({ meta: [{ title: pageTitle("Shared") }] }),
  component: SharedPage,
});
