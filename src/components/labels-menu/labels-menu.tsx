import { Combobox } from "@base-ui/react/combobox";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { PullGlyph, Spinner } from "@/components/checks-rows";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  pullControlKey,
  pullControlKeys,
  pullLabelOptionsAtom,
  setPullLabelAtom,
} from "@/data/atoms/pull-controls";
import { organizationsAtom } from "@/data/atoms/session";
import { Icon } from "@/primitives/icon";
import { menuRowVariants } from "@/primitives/menu";
import {
  MenuCombobox,
  MenuComboboxContent,
  MenuComboboxInput,
  MenuComboboxItem,
  MenuComboboxList,
  MenuComboboxTrigger,
} from "@/primitives/menu-combobox";
import {
  labelColor,
  labelMatches,
  labelMenuItems,
  labelsKey,
  labelToggle,
  type PullLabel,
  readLabels,
  sameLabel,
  sortLabels,
} from "./labels";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const iconXsSlot = "flex size-(--icon-xs) shrink-0 items-center justify-center";
export const pullFieldTrigger = cx(
  "-mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium text-foreground",
  "outline-none select-none transition-colors duration-100 hover:bg-secondary data-[popup-open]:bg-secondary",
  "focus-visible:outline-ring-inset",
);
export const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
export const menuEmptyRow =
  "flex h-(--h-menu-row) items-center px-2 text-sm text-muted-foreground-2";
const fadeText = "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

/** A label's colour dot; unknown colours fall back to a muted dot. */
export function LabelDot({ color }: { color: string | null }) {
  const fill = labelColor(color);
  return (
    <span
      aria-hidden
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        fill === undefined && "bg-muted-foreground-3",
      )}
      style={fill === undefined ? undefined : { backgroundColor: fill }}
    />
  );
}

/** The muted "+ Add …" text an empty pull field shows. */
export function AddPlaceholder({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={iconXsSlot}>
        <PullGlyph name="plus-large" className="size-3" />
      </span>
      {label}
    </span>
  );
}

function LabelChip({ label }: { label: PullLabel }) {
  return (
    <span className="flex max-w-full min-w-0 items-center gap-1">
      <span className={iconXsSlot}>
        <LabelDot color={label.color} />
      </span>
      <span className="truncate">{label.name}</span>
    </span>
  );
}

export type LabelsMenuProps = {
  /** The labels on the pull now. */
  applied: ReadonlyArray<PullLabel>;
  /** The repo's labels, or null while they load. */
  options: ReadonlyArray<PullLabel> | null;
  /** The label whose write is in flight. */
  pending: string | null;
  onToggle: (name: string, applied: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuery?: string;
  footer?: ReactNode;
};

/** The pull's Labels field and its searchable multi-select menu. */
export function LabelsMenu({
  applied,
  options,
  pending,
  onToggle,
  open,
  onOpenChange,
  defaultQuery,
  footer,
}: LabelsMenuProps) {
  const items = labelMenuItems(options, applied);
  const selected = items.filter((item) =>
    applied.some((label) => sameLabel(label, item)),
  );
  return (
    <MenuCombobox<PullLabel, true>
      items={items}
      multiple
      value={selected}
      onValueChange={(next) => {
        if (pending !== null) return;
        const toggle = labelToggle(next, selected);
        if (toggle !== null) onToggle(toggle.name, toggle.applied);
      }}
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      defaultInputValue={defaultQuery}
      isItemEqualToValue={sameLabel}
      itemToStringLabel={(label) => label.name}
      filter={labelMatches}
    >
      <MenuComboboxTrigger
        nativeButton={false}
        render={<div />}
        className={cx(
          pullFieldTrigger,
          "h-auto min-h-6 max-w-full flex-wrap gap-x-3 gap-y-1 py-1",
        )}
      >
        {applied.length === 0 ? (
          <AddPlaceholder label="Add labels" />
        ) : (
          applied.map((label) => <LabelChip key={label.name} label={label} />)
        )}
      </MenuComboboxTrigger>
      <MenuComboboxContent align="start" className="w-80">
        <MenuComboboxInput
          className={menuSearchInput}
          placeholder="Search labels"
        />
        <div className="-mx-1 my-1 h-px shrink-0 bg-border-1" />
        <Combobox.Empty className={menuEmptyRow}>
          {options === null ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Loading labels
            </span>
          ) : (
            "No matching labels"
          )}
        </Combobox.Empty>
        <MenuComboboxList>
          {(label: PullLabel) => (
            <MenuComboboxItem
              key={label.name}
              value={label}
              disabled={pending === label.name}
              className={menuRowVariants()}
            >
              <LabelDot color={label.color} />
              <span className={fadeText}>{label.name}</span>
              <Combobox.ItemIndicator className="ml-auto">
                <Icon
                  name="checkmark-1"
                  className="size-(--icon-sm) text-foreground"
                />
              </Combobox.ItemIndicator>
            </MenuComboboxItem>
          )}
        </MenuComboboxList>
        {footer}
      </MenuComboboxContent>
    </MenuCombobox>
  );
}

const noOrg = "" as OrgId;

const idleOptionsAtom = Atom.make(AsyncResult.initial());

export type LabelsControlProps = {
  pull: { id: string; labels: ReadonlyArray<PullLabel> };
  defaultOpen?: boolean;
  defaultQuery?: string;
};

/**
 * Capy's LabelsControl: loads the repo's labels when opened and writes each
 * toggle through `pulls.setLabel`, holding the answer until the pull refetches.
 */
export function LabelsControl({
  pull,
  defaultOpen = false,
  defaultQuery,
}: LabelsControlProps) {
  const organizations = useAtomValue(organizationsAtom);
  const orgId = AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
  const [open, setOpen] = useState(defaultOpen);
  const options = useAtomValue(
    open
      ? pullLabelOptionsAtom(pullControlKey(orgId ?? noOrg, pull.id))
      : idleOptionsAtom,
  );
  const setLabel = useAtomSet(setPullLabelAtom, { mode: "promise" });
  const [pending, setPending] = useState<string | null>(null);
  const [local, setLocal] = useState<{
    base: string;
    labels: ReadonlyArray<PullLabel>;
  } | null>(null);
  if (orgId === undefined) return null;
  const base = labelsKey(pull.labels);
  const applied =
    local !== null && local.base === base ? local.labels : pull.labels;
  const loaded = AsyncResult.isSuccess(options)
    ? readLabels(options.value)
    : null;

  const toggle = (name: string, nextApplied: boolean) => {
    setPending(name);
    const option = loaded?.find((label) => label.name === name);
    setLabel({
      params: { orgId, pullId: pull.id },
      payload: { name, applied: nextApplied, labelId: option?.id },
      reactivityKeys: pullControlKeys(orgId, pull.id),
    })
      .then((response) =>
        setLocal({ base, labels: sortLabels(readLabels(response)) }),
      )
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "GitHub refused this action",
        ),
      )
      .finally(() => setPending(null));
  };

  return (
    <LabelsMenu
      applied={applied}
      options={loaded}
      pending={pending}
      onToggle={toggle}
      open={open}
      onOpenChange={setOpen}
      defaultQuery={defaultQuery}
    />
  );
}
