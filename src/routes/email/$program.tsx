import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/not-found-page";
import { EmailPage, isEmailProgram } from "@/features/onboarding/email-page";

export const Route = createFileRoute("/email/$program")({
  component: RouteComponent,
});

function RouteComponent() {
  const { program } = Route.useParams();
  if (!isEmailProgram(program)) return <NotFoundPage />;
  return <EmailPage program={program} />;
}
