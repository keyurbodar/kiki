import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/not-found-page";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/$")({
  head: () => ({ meta: [{ title: pageTitle("Page not found") }] }),
  beforeLoad: () => {
    throw notFound();
  },
  notFoundComponent: NotFoundRoute,
});

function NotFoundRoute() {
  return <NotFoundPage />;
}
