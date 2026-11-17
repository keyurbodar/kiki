import { createFileRoute } from "@tanstack/react-router";
import { DrawerSpecimen } from "@/primitives/drawer/drawer.specimen";

export const Route = createFileRoute("/__p17")({
  component: () => (
    <div className="min-h-dvh bg-background text-foreground">
      <DrawerSpecimen />
    </div>
  ),
});
