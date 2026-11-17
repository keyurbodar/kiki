import { cx } from "class-variance-authority";
import { SkeletonPanel } from "@/primitives/skeleton-panel";

type SkeletonTurn =
  | { kind: "agent"; sections: readonly (readonly string[])[] }
  | { kind: "user"; width: string };

const TURNS: readonly SkeletonTurn[] = [
  { kind: "agent", sections: [["w-full", "w-2/3"]] },
  { kind: "user", width: "w-1/3" },
  { kind: "agent", sections: [["w-1/2"], ["w-full", "w-5/6", "w-2/5"]] },
  { kind: "user", width: "w-1/5" },
  { kind: "agent", sections: [["w-full", "w-3/4"]] },
  { kind: "user", width: "w-2/5" },
  { kind: "agent", sections: [["w-2/3"], ["w-full", "w-11/12", "w-3/5"]] },
  { kind: "user", width: "w-1/4" },
  { kind: "agent", sections: [["w-full", "w-1/2"]] },
  { kind: "user", width: "w-1/3" },
  { kind: "agent", sections: [["w-3/5"], ["w-full", "w-9/12", "w-2/5"]] },
  { kind: "user", width: "w-1/5" },
  { kind: "agent", sections: [["w-1/2"], ["w-full", "w-2/3"]] },
  { kind: "user", width: "w-2/5" },
];

export type ChatSkeletonProps = { leaving?: boolean };

/** Placeholder conversation shown while a thread's history loads. */
export function ChatSkeleton({ leaving = false }: ChatSkeletonProps) {
  return (
    <SkeletonPanel
      role="status"
      aria-label="Loading conversation"
      aria-busy
      className={cx(
        "pointer-events-none absolute inset-0 overflow-hidden",
        leaving && "opacity-0 delay-0 duration-fast",
      )}
    >
      <div className="flex h-full flex-col justify-end pb-12 [mask-image:linear-gradient(to_bottom,transparent,black_calc(var(--spacing)*32))]">
        <div className="mx-auto w-full max-w-4xl px-4 text-markdown">
          {TURNS.map((turn, index) =>
            turn.kind === "user" ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
              <div key={index} className="flex justify-end pt-8 pb-2">
                <div
                  className={cx(
                    "h-[calc(1lh+var(--spacing)*4)] rounded-(--radius-card) bg-secondary",
                    turn.width,
                  )}
                />
              </div>
            ) : (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
                key={index}
                className="flex flex-col gap-[1.5em] pt-8 pb-2 max-md:gap-[1.25em]"
              >
                {turn.sections.map((lines, section) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
                  <div key={section}>
                    {lines.map((width, line) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
                      <div key={line} className="flex h-[1lh] items-center">
                        <div
                          className={cx("h-3 rounded bg-secondary", width)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
      </div>
    </SkeletonPanel>
  );
}
