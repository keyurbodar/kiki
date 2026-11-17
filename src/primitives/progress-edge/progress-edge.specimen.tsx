import { ProgressEdge } from "./progress-edge";

export function ProgressEdgeSpecimen() {
  return (
    <div className="flex w-lg flex-col gap-6 p-6">
      <div className="rounded bg-card">
        <div className="h-10" />
        <ProgressEdge />
      </div>
      <div className="rounded bg-card">
        <div className="h-10" />
        <ProgressEdge active={false} />
      </div>
    </div>
  );
}
