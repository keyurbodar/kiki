import { createFileRoute } from "@tanstack/react-router";
import { DesktopPasskeyPage } from "@/features/desktop/desktop-passkey";

export const Route = createFileRoute("/desktop_/passkey")({
  component: DesktopPasskeyPage,
});
