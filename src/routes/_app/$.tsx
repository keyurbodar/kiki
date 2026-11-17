import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundCard } from "@/components/not-found-page";

export const Route = createFileRoute("/_app/$")({
  head: () => ({ meta: [{ title: "Page not found" }] }),
  beforeLoad: () => {
    throw notFound();
  },
  notFoundComponent: NotFoundCard,
});
