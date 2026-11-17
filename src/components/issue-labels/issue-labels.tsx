import { useAtomSet } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { useState } from "react";
import {
  IssuePickerEmpty,
  issuePickerGlyphClass,
  PlusLargeGlyph,
} from "@/components/issue-pickers";
import {
  type IssueColorKey,
  isIssueColorKey,
  issueColorStyles,
} from "@/components/issue-states";
import { issueColors } from "@/data/api/schemas/issue";
import { issueReactivityKeys } from "@/data/atoms/issues";
import { ApiClient } from "@/data/client/ApiClient";
import { Badge } from "@/primitives/badge";
import { MenuItem } from "@/primitives/menu";

export type IssueLabelSummary = {
  readonly id: string;
  readonly name: string;
  readonly color: string;
};

/** An issue can carry at most this many labels. */
export const issueLabelLimit = 20;

/** Label names compare after NFC normalisation, dropping format characters and collapsing whitespace. */
export const normalizeLabelName = (name: string) =>
  name
    .normalize("NFC")
    .replace(/\p{Cf}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const rotation = issueColors.filter((key) => key !== "gray");

/** The colour a new label gets: the palette without gray, in turn by label count. */
export const nextLabelColor = (count: number): IssueColorKey =>
  rotation[count % rotation.length] ?? "blue";

export const findLabelByName = (
  labels: ReadonlyArray<IssueLabelSummary>,
  name: string,
) => {
  const wanted = normalizeLabelName(name).toLowerCase();
  return labels.find(
    (label) => normalizeLabelName(label.name).toLowerCase() === wanted,
  );
};

const swatchOf = (color: string) =>
  isIssueColorKey(color)
    ? issueColorStyles[color].swatch
    : issueColorStyles.gray.swatch;

export type IssueLabelDotProps = { color: string; className?: string };

export function IssueLabelDot({ color, className }: IssueLabelDotProps) {
  return (
    <span
      aria-hidden
      className={cx("size-2 shrink-0 rounded-full", swatchOf(color), className)}
    />
  );
}

export type IssueLabelBadgesProps = {
  labels: ReadonlyArray<IssueLabelSummary>;
};

/** A list row's label badges; the second and later ones hide as the list narrows. */
export function IssueLabelBadges({ labels }: IssueLabelBadgesProps) {
  return labels.map((label, index) => (
    <Badge
      key={label.id}
      size="xs"
      className={cx(
        "max-w-32 min-w-0 shrink-0",
        index === 1 && "@max-2xl/list:hidden",
        index > 1 && "@max-4xl/list:hidden",
      )}
    >
      <IssueLabelDot color={label.color} />
      <span className="min-w-0 truncate">{label.name}</span>
    </Badge>
  ));
}

/** The dots and joined names a labels trigger shows. */
export function IssueLabelSummaryValue({
  labels,
}: {
  labels: ReadonlyArray<IssueLabelSummary>;
}) {
  return (
    <>
      <span className="flex shrink-0 items-center -space-x-0.5">
        {labels.map((label) => (
          <IssueLabelDot
            key={label.id}
            color={label.color}
            className="ring-2 ring-background"
          />
        ))}
      </span>
      <span className="min-w-0 truncate text-foreground">
        {labels.map((label) => label.name).join(", ")}
      </span>
    </>
  );
}

const createLabelAtom = ApiClient.mutation("issue-labels", "createLabel");

export type UseCreateIssueLabelOptions = {
  orgId: string | undefined;
  labels: ReadonlyArray<IssueLabelSummary>;
  selected: ReadonlyArray<string>;
  onCreated: (label: IssueLabelSummary) => void;
  reactivityKeys?: ReadonlyArray<string>;
};

/**
 * Creates a label from the typed name with the next rotation colour. It does
 * nothing for an empty name, a name that already exists, while a create is in
 * flight, or once the issue has `issueLabelLimit` labels.
 */
export function useCreateIssueLabel({
  orgId,
  labels,
  selected,
  onCreated,
  reactivityKeys,
}: UseCreateIssueLabelOptions) {
  const create = useAtomSet(createLabelAtom, { mode: "promise" });
  const [pending, setPending] = useState(false);
  const full = selected.length >= issueLabelLimit;
  const submit = (query: string) => {
    const name = normalizeLabelName(query);
    if (orgId === undefined || name === "" || pending || full) return;
    if (findLabelByName(labels, name) !== undefined) return;
    setPending(true);
    create({
      params: { orgId },
      payload: { name, color: nextLabelColor(labels.length) },
      reactivityKeys: reactivityKeys ?? [issueReactivityKeys.labels(orgId)],
    })
      .then((label) => onCreated(label as IssueLabelSummary))
      .catch(() => undefined)
      .finally(() => setPending(false));
  };
  return { submit, pending, full };
}

export type IssueLabelCreateRowProps = {
  query: string;
  labels: ReadonlyArray<IssueLabelSummary>;
  matches: number;
  pending: boolean;
  full: boolean;
  onCreate: () => void;
};

/**
 * The footer of the labels picker: a create row when the typed name is new,
 * the hint when nothing matches, otherwise nothing.
 */
export function IssueLabelCreateRow({
  query,
  labels,
  matches,
  pending,
  full,
  onCreate,
}: IssueLabelCreateRowProps) {
  const name = normalizeLabelName(query);
  if (name !== "" && findLabelByName(labels, name) === undefined)
    return (
      <MenuItem
        closeOnClick={false}
        disabled={pending || full}
        onClick={onCreate}
      >
        <span className={issuePickerGlyphClass}>
          <PlusLargeGlyph />
        </span>
        <span className="min-w-0 truncate">{`Create label "${name}"`}</span>
      </MenuItem>
    );
  if (matches === 0)
    return <IssuePickerEmpty>Type a name to create a label</IssuePickerEmpty>;
  return null;
}
