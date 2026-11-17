import type { ReactNode } from "react";
import { issueColorClasses } from "@/features/issues/issue-parts";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";

export type StateIcon = { readonly key: string; readonly label: string };

const glyphs: Readonly<Record<string, IconId>> = {
  dashed: "circle-dashed",
  empty: "circle-dotted",
  half: "circle-half-fill",
  progress: "progress-75",
  check: "check-circle-2",
  x: "circle-x",
  clock: "clock",
  hourglass: "hourglass",
  snooze: "clock-snooze",
  calendar: "calendar-clock",
  pause: "pause",
  hand: "hand-5-finger",
  stop: "stop-circle",
  chat: "bubble-2",
  question: "bubble-question",
  external: "arrow-up-right",
  sleep: "sleep",
  eye: "eye-open",
  testtube: "test-tube",
  search: "magnifying-glass",
  shield: "shield-check",
  approved: "bubble-check",
  pull: "pull-request",
  clipboard: "clipboard",
  code: "code",
  rocket: "rocket",
  box: "box-2",
  package: "package",
  flag: "flag-1",
  upload: "cloud-upload",
  shipping: "shipping",
  truck: "truck",
  parachute: "parachute",
  bug: "bug",
  inbox: "inbox-empty",
  fire: "fire-1",
  warning: "exclamation-triangle",
  alert: "exclamation-circle",
  siren: "siren",
  unknown: "circle-questionmark",
  idea: "lightbulb-glow",
  circlecheck: "circle-check",
  checkmark: "checkmark-1",
  inboxdone: "inbox-checked",
  trophy: "trophy",
  archive: "archive",
  minus: "circle-minus",
  ban: "circle-ban-sign",
  duplicate: "square-behind-square-2",
};

const labels: Readonly<Record<string, string>> = {
  dashed: "Dashed circle",
  empty: "Empty circle",
  half: "Half circle",
  progress: "Ring with progress",
  check: "Check circle",
  x: "X circle",
  clock: "Clock",
  hourglass: "Hourglass",
  snooze: "Snoozed",
  calendar: "Scheduled",
  pause: "Paused",
  hand: "Blocked",
  stop: "Stopped",
  chat: "Waiting on customer",
  question: "Needs answer",
  external: "Waiting on external",
  sleep: "Dormant",
  eye: "Eye",
  testtube: "Test tube",
  search: "Magnifying glass",
  shield: "Shield check",
  approved: "Approved",
  pull: "Pull request",
  clipboard: "Clipboard",
  code: "Code",
  rocket: "Rocket",
  box: "Box",
  package: "Package",
  flag: "Flag",
  upload: "Upload",
  shipping: "Shipping",
  truck: "Truck",
  parachute: "Parachute",
  bug: "Bug",
  inbox: "Inbox",
  fire: "Fire",
  warning: "Warning",
  alert: "Alert",
  siren: "Siren",
  unknown: "Question",
  idea: "Idea",
  circlecheck: "Circle check",
  checkmark: "Checkmark",
  inboxdone: "Inbox done",
  trophy: "Trophy",
  archive: "Archive",
  minus: "Minus circle",
  ban: "Won't do",
  duplicate: "Duplicate",
};

export const stateIcons: ReadonlyArray<StateIcon> = Object.keys(labels).map(
  (key) => ({
    key,
    label: labels[key] ?? key,
  }),
);

export const stateIconName = (key: string) => glyphs[key] ?? "circle-dotted";

export function stateIconGlyph(
  key: string,
  color: string,
  className?: string,
): ReactNode {
  const tone =
    issueColorClasses[color as keyof typeof issueColorClasses]?.text ??
    issueColorClasses.gray.text;
  return (
    <Icon
      name={stateIconName(key)}
      className={["size-(--icon-sm) shrink-0", tone, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
