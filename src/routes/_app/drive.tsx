import { createFileRoute } from "@tanstack/react-router";
import { DrivePage } from "@/features/drive/drive-page";

export const Route = createFileRoute("/_app/drive")({
  component: DrivePage,
});
