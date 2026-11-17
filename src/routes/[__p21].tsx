import { createFileRoute } from "@tanstack/react-router";
import { BreadcrumbSpecimen } from "@/primitives/breadcrumb/breadcrumb.specimen";
import { BulkBarSpecimen } from "@/primitives/bulk-bar/bulk-bar.specimen";
import { TableSpecimen } from "@/primitives/table/table.specimen";

export const Route = createFileRoute("/__p21")({
  component: () => (
    <div className="min-h-dvh bg-background text-foreground">
      <div id="table">
        <TableSpecimen />
      </div>
      <div id="breadcrumb">
        <BreadcrumbSpecimen />
      </div>
      <div id="bulk-bar">
        <BulkBarSpecimen />
      </div>
    </div>
  ),
});
