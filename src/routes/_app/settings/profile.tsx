import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/settings/profile-page";

export const Route = createFileRoute("/_app/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProfilePage />;
}
