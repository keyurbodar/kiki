import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/auth/auth-layout";
import { NotMePage } from "@/features/auth/not-me";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/security/not-me")({
  validateSearch: searchParams(["token"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return (
    <AuthLayout>
      <NotMePage token={token} />
    </AuthLayout>
  );
}
