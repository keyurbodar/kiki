import { SkeletonPulse } from "./skeleton-panel";

const ROWS = [
  { title: "w-36", description: "w-56" },
  { title: "w-44", description: "w-48" },
  { title: "w-32", description: "w-60" },
];

export function SkeletonPanelSpecimen() {
  return (
    <SkeletonPulse label="Loading threads" className="flex w-lg flex-col p-6">
      {ROWS.map((row) => (
        <div
          key={row.title}
          className="flex items-center justify-between gap-3 p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="size-8 shrink-0 rounded-md bg-secondary" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className={`h-3 rounded bg-secondary ${row.title}`} />
              <div className={`h-3 rounded bg-secondary ${row.description}`} />
            </div>
          </div>
          <div className="h-5 w-16 shrink-0 rounded bg-secondary" />
        </div>
      ))}
    </SkeletonPulse>
  );
}
