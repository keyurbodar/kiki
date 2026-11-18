import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import { cx } from "@/components/activity-card";
import { Button } from "@/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  mergePullAtom,
  pullChecksAtom,
  pullReactivityKeys,
  setAutoMergeAtom,
  updateBranchAtom,
} from "./atoms";
import { usePullOrgId } from "./context";
import {
  ChevronDownSmallIcon,
  CircleDashedIcon,
  CrossMediumIcon,
  MergedIcon,
} from "./icons";
import {
  checkVerdict,
  type Pull,
  type PullMergeableState,
  type PullMergeMethod,
  toCheckRows,
} from "./pull-model";
import { resultValue } from "./result";

const track = (name: string) => `shared/pull-view/merge-controls.tsx#${name}`;

export const mergeMethodLabels: Record<
  PullMergeMethod,
  { readonly label: string; readonly description: string }
> = {
  squash: { label: "Squash and merge", description: "Combine all commits" },
  merge: { label: "Merge commit", description: "Preserve commit history" },
  rebase: { label: "Rebase and merge", description: "Reapply all commits" },
};

export const mergeMethods: ReadonlyArray<PullMergeMethod> = [
  "squash",
  "merge",
  "rebase",
];

export type MergeGate = {
  readonly blocked: boolean;
  readonly conflicts: boolean;
  readonly draft: boolean;
  readonly failing: number;
  readonly pending: number;
};

export const toMergeGate = (
  state: PullMergeableState,
  pullState: Pull["state"],
  verdicts: ReadonlyArray<string>,
): MergeGate => ({
  blocked: state === "dirty" || pullState === "draft",
  conflicts: state === "dirty",
  draft: pullState === "draft",
  failing: verdicts.filter((verdict) => verdict === "failure").length,
  pending: verdicts.filter((verdict) => verdict === "pending").length,
});

export const mergeGateCopy = (gate: MergeGate, baseRef: string): string => {
  if (gate.conflicts) return "Merge conflicts";
  if (gate.draft) return "Draft pull requests cannot merge";
  if (gate.failing > 0) return `${gate.failing} checks failing`;
  if (gate.pending > 0) return `${gate.pending} checks running`;
  return `Ready to merge into ${baseRef}`;
};

const isBlockedByChecks = (gate: MergeGate): boolean =>
  gate.pending > 0 || gate.failing > 0;

export function MergeControls({
  baseRef,
  pull,
}: {
  pull: Pull;
  baseRef: string;
}) {
  const orgId = usePullOrgId();
  const checkResult = useAtomValue(pullChecksAtom(orgId, pull.id));
  const merge = useAtomSet(mergePullAtom, { mode: "promise" });
  const setAutoMerge = useAtomSet(setAutoMergeAtom, { mode: "promise" });
  const updateBranch = useAtomSet(updateBranchAtom, { mode: "promise" });
  const [method, setMethod] = useState<PullMergeMethod>("squash");
  const [comment, setComment] = useState("");
  const [force, setForce] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"merge" | "auto" | "branch" | null>(null);
  const rows = toCheckRows(resultValue(checkResult) ?? []);
  const gate = toMergeGate(
    pull.mergeableState,
    pull.state,
    rows.map(checkVerdict),
  );
  const behind = pull.mergeableState === "behind";
  const params = { orgId, pullId: pull.id };
  const reactivityKeys = pullReactivityKeys(orgId, pull.id);
  const disabled = gate.blocked || (isBlockedByChecks(gate) && !force);
  const panelMethod = mergeMethodLabels[method];

  if (pull.state === "merged" || pull.state === "closed") return null;

  const submit = () => {
    if (disabled || busy !== null) return;
    setBusy("merge");
    void merge({
      params,
      reactivityKeys,
      payload: {
        method,
        ...(comment.trim() === "" ? {} : { comment: comment.trim() }),
        force: force && isBlockedByChecks(gate),
      },
    })
      .then(() => {
        setOpen(false);
        setComment("");
        toast.success("Merged");
      })
      .catch(() => toast.error("GitHub could not merge"))
      .finally(() => setBusy(null));
  };

  const toggleAutoMerge = (enabled: boolean) => {
    setBusy("auto");
    void setAutoMerge({
      params,
      reactivityKeys,
      payload: enabled ? { enabled: true, method } : { enabled: false },
    })
      .then(() =>
        toast.success(
          enabled
            ? pull.autoMerge
              ? "Auto-merge updated"
              : "Auto-merge enabled"
            : "Auto-merge disabled",
        ),
      )
      .catch(() => toast.error("Blocked on GitHub"))
      .finally(() => setBusy(null));
  };

  const requestUpdate = () => {
    setBusy("branch");
    void updateBranch({ params, reactivityKeys })
      .then(() => toast.success("Branch update requested"))
      .catch(() => toast.error("Blocked on GitHub"))
      .finally(() => setBusy(null));
  };

  return (
    <div data-slot="merge-controls" className="flex flex-col gap-2">
      {behind && (
        <div
          data-slot="merge-branch-update"
          className="flex items-center justify-between gap-3 rounded-(--radius-card) border-hairline border-border-2 bg-secondary px-3 py-2"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              This branch is behind {baseRef}
            </span>
            <span className="truncate text-xs text-muted-foreground-2">
              Merge the latest base into this branch
            </span>
          </span>
          <Button
            data-track-owner={track("MergePanel:button[onClick=onUpdate]")}
            size="sm"
            variant="outline"
            loading={busy === "branch"}
            disabled={busy !== null}
            onClick={requestUpdate}
          >
            Update branch
          </Button>
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex items-stretch">
          <Button
            data-track-owner={track("MergeControls:Button.3")}
            size="sm"
            intent={gate.conflicts ? "neutral" : "accent"}
            className="min-w-0 flex-1 rounded-r-none"
            loading={busy === "merge"}
            disabled={disabled || busy !== null}
            onClick={submit}
          >
            {gate.conflicts ? (
              <CrossMediumIcon className="size-(--icon-sm)" />
            ) : (
              <MergedIcon className="size-(--icon-sm)" />
            )}
            {gate.conflicts ? "Merge conflicts" : "Merge"}
          </Button>
          <PopoverTrigger
            render={
              <Button
                data-track-owner={track("MergeControls:PopoverTrigger.1")}
                size="sm"
                intent={gate.conflicts ? "neutral" : "accent"}
                className="rounded-l-none border-l-0 px-2"
                aria-label="Merge options"
              />
            }
          >
            <ChevronDownSmallIcon className="size-(--icon-sm)" />
          </PopoverTrigger>
        </div>
        <PopoverContent align="end" className="w-72 p-0">
          <div className="flex flex-col gap-3 px-2 pt-1 pb-2">
            <div className="flex items-center gap-2 text-xs">
              {gate.conflicts || gate.draft ? (
                <CrossMediumIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-2" />
              ) : (
                <CircleDashedIcon
                  className={cx(
                    "size-(--icon-sm) shrink-0",
                    isBlockedByChecks(gate)
                      ? "text-warning-fg"
                      : "text-muted-foreground-2",
                  )}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-muted-foreground-1">
                {mergeGateCopy(gate, baseRef)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {mergeMethods.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  data-track-owner={track("MergeMethodPanel:button.1")}
                  aria-pressed={method === candidate}
                  onClick={() => setMethod(candidate)}
                  data-selected={method === candidate ? "" : undefined}
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-secondary data-[selected]:bg-secondary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">
                      {mergeMethodLabels[candidate].label}
                    </span>
                    <span className="block text-xs text-muted-foreground-2">
                      {mergeMethodLabels[candidate].description}
                    </span>
                  </span>
                  <span className="flex size-(--icon-sm) shrink-0 items-center justify-center">
                    {method === candidate && (
                      <span className="size-2 rounded-full bg-foreground" />
                    )}
                  </span>
                </button>
              ))}
            </div>
            {isBlockedByChecks(gate) && !gate.blocked && (
              <button
                type="button"
                data-track-owner={track("MergePanel:button.1")}
                aria-pressed={force}
                onClick={() => setForce(!force)}
                data-selected={force ? "" : undefined}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-secondary data-[selected]:bg-secondary"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">
                    Force merge
                  </span>
                  <span className="block text-xs text-muted-foreground-2">
                    Attempt before checks pass
                  </span>
                </span>
              </button>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground-2">
                Comment before merging
              </span>
              <textarea
                aria-label="Comment before merging"
                placeholder="Leave a comment (optional)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    submit();
                  }
                }}
                className="field-sizing-content min-h-12 w-full resize-none rounded border-hairline border-border-2 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
              />
            </label>
            <Button
              data-track-owner={track("MergePanel:button.2")}
              size="sm"
              intent={gate.conflicts ? "neutral" : "accent"}
              loading={busy === "merge"}
              disabled={disabled || busy !== null}
              onClick={submit}
            >
              {panelMethod.label}
            </Button>
            <span className="h-px bg-border-1" />
            {pull.autoMerge ? (
              <button
                type="button"
                data-track-owner={track(
                  "AutoMergePanel:button[onClick=onDisable]",
                )}
                onClick={() => toggleAutoMerge(false)}
                disabled={busy !== null}
                className="flex flex-col items-start rounded px-2 py-1.5 text-left hover:bg-secondary"
              >
                <span className="text-sm text-foreground">
                  Disable auto-merge
                </span>
                <span className="text-xs text-muted-foreground-2">
                  Stop automatic merging
                </span>
              </button>
            ) : (
              <button
                type="button"
                data-track-owner={track("AutoMergePanel:button.1")}
                onClick={() => toggleAutoMerge(true)}
                disabled={busy !== null}
                className="flex flex-col items-start rounded px-2 py-1.5 text-left hover:bg-secondary"
              >
                <span className="text-sm text-foreground">
                  Enable auto-merge
                </span>
                <span className="text-xs text-muted-foreground-2">
                  Merge when checks pass
                </span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
