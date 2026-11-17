import type { PullSection } from "@/features/pulls/pulls-page/model";
import { PullRow } from "./pull-row";

/** Sectioned pull request list (Capy's PullsList). */
export function PullsList({
  sections,
  now,
  multirepo,
}: {
  sections: ReadonlyArray<PullSection>;
  now: number;
  multirepo: boolean;
}) {
  const longestCode = Math.max(
    3,
    ...sections.flatMap((section) =>
      section.members.map(
        (pull) =>
          (multirepo ? pull.repo.length - pull.repo.indexOf("/") : 1) +
          String(pull.number).length,
      ),
    ),
  );
  return (
    <div
      data-slot="pulls-list"
      className="@container/list flex flex-col gap-3 px-2 pb-6"
      style={{ "--pull-code-width": `${longestCode + 1}ch` } as never}
    >
      {sections.map((section) => (
        <section key={section.id} aria-label={section.label}>
          <h2 className="flex h-8 items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground-1">
            {section.label}
            {section.showCount ? (
              <span className="text-muted-foreground-3 tabular-nums">
                {section.members.length}
              </span>
            ) : null}
          </h2>
          {section.members.map((pull) => (
            <PullRow
              key={pull.id}
              pull={pull}
              now={now}
              multirepo={multirepo}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
