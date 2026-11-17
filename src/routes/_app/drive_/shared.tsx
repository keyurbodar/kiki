import { createFileRoute } from "@tanstack/react-router";
import { SharedPage } from "@/features/drive/drive-page";

export const Route = createFileRoute("/_app/drive_/shared")({
  component: SharedPage,
});
