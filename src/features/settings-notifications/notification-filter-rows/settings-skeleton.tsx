import { Card } from "@/primitives/card";

const widths = [
  { title: "w-36", description: "w-56" },
  { title: "w-44", description: "w-48" },
  { title: "w-32", description: "w-60" },
] as const;

export type SettingsSkeletonCardProps = { rows?: number; label: string };

export function SettingsSkeletonCard({
  rows = 2,
  label,
}: SettingsSkeletonCardProps) {
  return (
    <div role="status" aria-label={label} aria-busy>
      <div className="animate-skeleton-pulse h-full motion-reduce:animate-none">
        <Card rows>
          {Array.from({ length: rows }, (_, index) => {
            const width = widths[index % widths.length] ?? widths[0];
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                key={index}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="size-8 shrink-0 rounded-md bg-secondary" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div
                      className={`h-3 rounded bg-secondary ${width.title}`}
                    />
                    <div
                      className={`h-3 rounded bg-secondary ${width.description}`}
                    />
                  </div>
                </div>
                <div className="h-5 w-16 shrink-0 rounded bg-secondary" />
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
