import { Breadcrumb } from "./breadcrumb";

export function BreadcrumbSpecimen() {
  return (
    <div className="bg-panel p-6">
      <Breadcrumb to="/settings/general" label="Settings" />
    </div>
  );
}
