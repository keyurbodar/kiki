import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  AnnotationSpecimen,
  type AnnotationSpecimenState,
} from "@/features/lightbox/annotation-specimen";

type Search = { state: AnnotationSpecimenState };

const STATES: AnnotationSpecimenState[] = ["annotate", "region", "list"];

export const Route = createFileRoute("/__annotations")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    state: STATES.includes(search.state as AnnotationSpecimenState)
      ? (search.state as AnnotationSpecimenState)
      : "annotate",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: AnnotationsSpecimenRoute,
});

function AnnotationsSpecimenRoute() {
  const { state } = Route.useSearch();
  return <AnnotationSpecimen key={state} state={state} />;
}
