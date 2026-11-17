import { cx } from "class-variance-authority";
import { DateTime } from "effect";
import type { IssueActor } from "@/data/api/schemas/issue";
import { Bubble } from "./glyphs";

/** A property value that opens a picker: Capy's inline issue property trigger. */
export const issuePropertyValue = cx(
  "-mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium text-foreground",
  "outline-none select-none transition-colors duration-100 hover:bg-secondary data-[popup-open]:bg-secondary",
  "focus-visible:outline-ring-inset",
);

/** The glyph slot in front of a property value. */
export const issuePropertyGlyph =
  "flex size-(--icon-xs) shrink-0 items-center justify-center";

/** The icon slot at the start of a menu row. */
export const issueMenuIcon =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

/** The search input that heads a menu. */
export const issueMenuInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

/** The empty line of a menu with nothing to pick yet. */
export const issueMenuEmpty =
  "px-2 py-3 text-center text-sm font-normal text-muted-foreground-2";

/** The pointer-coarse hit area Capy adds to small inline buttons. */
export const issueCoarseHitArea =
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2";

/** How an actor is named in properties and activity. */
export const issueActorName = (actor: IssueActor) =>
  actor.kind === "jam" && !actor.captain && actor.code !== null
    ? `${actor.code} ${actor.name}`
    : actor.name;

/** How an actor is named at the start of an activity line. */
export const issueActorLead = (actor: IssueActor | null) =>
  actor === null
    ? "Capy"
    : actor.captain
      ? actor.name
      : (actor.code ?? actor.name);

/** A person's avatar, a captain's portrait, or a thread's bubble. */
export function IssueActorAvatar({
  actor,
  className,
}: {
  actor: IssueActor;
  className?: string;
}) {
  if (actor.kind === "jam" && !actor.captain) {
    return (
      <Bubble className={cx("size-(--icon-xs) text-icon-muted", className)} />
    );
  }
  if (actor.avatarUrl !== null) {
    return (
      <img
        data-slot="issue-actor-avatar"
        src={actor.avatarUrl}
        alt=""
        className={cx("size-4 shrink-0 rounded-sm object-cover", className)}
      />
    );
  }
  return (
    <span
      data-slot="issue-actor-avatar"
      aria-hidden
      className={cx(
        "flex size-4 shrink-0 items-center justify-center rounded-full bg-secondary text-2xs font-medium text-foreground uppercase",
        className,
      )}
    >
      {actor.name.slice(0, 1)}
    </span>
  );
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/** Capy's relative time: "just now", "5m ago", "19h ago", "in 2d". */
export function relativeTime(
  at: Date | number,
  options?: { now?: number; minified?: boolean },
) {
  const delta =
    (options?.now ?? Date.now()) - (typeof at === "number" ? at : at.getTime());
  const minified = options?.minified === true;
  const size = Math.abs(delta);
  if (size < 5 * second) return minified ? "now" : "just now";
  const short =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  return minified ? short : delta < 0 ? `in ${short}` : `${short} ago`;
}

/** A decoded timestamp as a Date. */
export const issueDate = (at: DateTime.Utc) =>
  new Date(DateTime.toEpochMillis(at));

/** Today in the viewer's own calendar, as a due-date day ("2026-11-17"). */
export const localToday = (now = Date.now()) => {
  const date = new Date(now);
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};
