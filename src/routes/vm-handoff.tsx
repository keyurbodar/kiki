import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  parseVmHandoffSearch,
  servicePreviewPane,
  VmHandoffPage,
} from "@/features/promotions/vm-handoff";

export const Route = createFileRoute("/vm-handoff")({
  validateSearch: parseVmHandoffSearch,
  beforeLoad: ({ search }) => {
    if (
      search.jamId !== undefined &&
      search.machineId !== undefined &&
      search.port !== undefined
    ) {
      throw redirect({
        to: "/thread/$threadId",
        params: { threadId: search.jamId },
        search: { pane: servicePreviewPane(search.machineId, search.port) },
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { machineId, port } = Route.useSearch();
  return <VmHandoffPage machineId={machineId} port={port} />;
}
