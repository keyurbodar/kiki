import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import { PullGlyph, Spinner } from "@/components/checks-rows";
import {
  mergePullAtom,
  pullControlKeys,
  setPullAutoMergeAtom,
  updatePullBranchAtom,
} from "@/data/atoms/pull-controls";
import { Icon } from "@/primitives/icon";
import { menuRowVariants } from "@/primitives/menu";
import { MenuRowContent } from "./menu-row-content";
import {
  autoMergeBlocked,
  forceMergeBlocked,
  landingPulls,
  type MergeMethod,
  mergeGate,
  mergeMethods,
  type PullState,
} from "./merge-gate";

export { MenuRowContent, MenuRowDrillContent } from "./menu-row-content";
export {
  autoMergeBlocked,
  forceMergeBlocked,
  isRuleRefusal,
  joinBlockers,
  landingPulls,
  type MergeGateInput,
  type MergeMethod,
  mergeFailureDescription,
  mergeGate,
  mergeMethods,
  type PullStack,
  type PullState,
  retryLabels,
  type StackMember,
} from "./merge-gate";

const iconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const panelLabel =
  "mt-1 flex min-h-[1.375rem] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";
const separator = "-mx-1 my-1 h-px bg-border-1";

export type MergeActionProps = {
  label: string;
  description: string;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onClick: () => void;
};

/** A wide menu row for one merge method or action. */
export function MergeActionRow({
  label,
  description,
  disabled = false,
  trailing,
  onClick,
}: MergeActionProps) {
  return (
    <button
      type="button"
      className={menuRowVariants({ density: "rich", interaction: "button" })}
      disabled={disabled}
      onClick={onClick}
    >
      <MenuRowContent
        density="rich"
        label={label}
        description={description}
        trailing={trailing}
      />
    </button>
  );
}

export type MergeGate = {
  open: boolean;
  draft: boolean;
  checksState: string;
  mergeableVerdict: string | null;
  blockers: ReadonlyArray<string>;
};

export type MergePanelProps = {
  label?: string;
  commentLabel: string;
  comment: string;
  onComment: (comment: string) => void;
  disabled: boolean;
  gate: string | null;
  gateDetails: ReadonlyArray<string>;
  onMerge: (method: MergeMethod, comment: string) => void;
  landing: ReadonlyArray<{
    id: string;
    number: number;
    title: string;
    state: PullState;
  }>;
  trunk: string | null;
};

/** The merge method panel with its optional comment and gate overlay. */
export function MergeMethodPanel({
  label = "Select method",
  commentLabel,
  comment,
  onComment,
  disabled,
  gate,
  gateDetails,
  onMerge,
  landing,
  trunk,
}: MergePanelProps) {
  return (
    <div className="flex flex-col">
      <div className="p-1">
        <textarea
          aria-label={commentLabel}
          placeholder="Leave a comment (optional)"
          value={comment}
          disabled={disabled}
          onChange={(event) => onComment(event.target.value)}
          className="min-h-12 w-full min-w-0 resize-y rounded bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground-3 focus-visible:outline-ring-inset"
        />
      </div>
      {landing.length > 1 && (
        <>
          <span className="mt-1 flex min-h-[1.375rem] items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0">
            Merging {landing.length} pulls into {trunk ?? "the trunk"}
          </span>
          <div className="flex flex-col pb-1">
            {landing.map((pull, index) => (
              <span
                key={pull.id}
                className="flex h-7 min-w-0 items-center gap-2 px-2 text-xs"
              >
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  {index < landing.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-[1.125rem] h-2 w-px bg-muted-foreground-3 opacity-60"
                    />
                  )}
                  <PullGlyph
                    name="pull-request"
                    className="size-3 text-success"
                  />
                </span>
                <span className="shrink-0 text-muted-foreground-2 tabular-nums">
                  #{pull.number}
                </span>
                <span className="min-w-0 truncate text-foreground">
                  {pull.title}
                </span>
              </span>
            ))}
          </div>
          <div className={separator} />
        </>
      )}
      <div
        className={
          gate === null
            ? "flex flex-col"
            : "pointer-events-none flex flex-col opacity-40 blur-xs transition-[opacity,filter] duration-100"
        }
      >
        <span className={panelLabel}>{label}</span>
        {mergeMethods.map((method) => (
          <MergeActionRow
            key={method.method}
            label={method.label}
            description={method.description}
            disabled={disabled}
            onClick={() => onMerge(method.method, comment)}
          />
        ))}
      </div>
      {gate !== null && (
        <div className="absolute inset-0 flex items-center justify-center p-3">
          {gateDetails.length > 0 ? (
            <div className="flex max-w-full flex-col items-center gap-1 text-center text-xs">
              <span className="font-medium text-foreground">
                Blocked on GitHub
              </span>
              <span className="text-muted-foreground">
                {gateDetails.join(", ")}
              </span>
            </div>
          ) : (
            <span className="max-w-full text-center text-xs font-medium text-foreground">
              {gate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export type NestedPanelProps = {
  label: string;
  disabled?: boolean;
  onBack: () => void;
  children: React.ReactNode;
};

/** A nested panel's back button and its divider. */
export function NestedPanel({
  label,
  disabled = false,
  onBack,
  children,
}: NestedPanelProps) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        className={menuRowVariants({ interaction: "button" })}
        disabled={disabled}
        onClick={onBack}
      >
        <span className={iconSlot}>
          <PullGlyph name="chevron-left-small" className="size-(--icon-sm)" />
        </span>
        <span className="font-medium">{label}</span>
      </button>
      <div className={separator} />
      {children}
    </div>
  );
}

export type AutoMergePanelProps = {
  method: MergeMethod | null;
  pending: boolean;
  onSelect: (method: MergeMethod | null) => void;
  onDisable: () => void;
};

/** The auto-merge method picker; the currently enabled method is disabled. */
export function AutoMergePanel({
  method,
  pending,
  onSelect,
  onDisable,
}: AutoMergePanelProps) {
  return (
    <div className="flex flex-col">
      <span className={panelLabel}>Select method</span>
      {mergeMethods.map((candidate) => (
        <MergeActionRow
          key={candidate.method}
          label={candidate.label}
          description={candidate.description}
          disabled={pending || method === candidate.method}
          trailing={
            method === candidate.method ? (
              <Icon
                name="checkmark-1"
                className="size-(--icon-sm) text-foreground"
              />
            ) : null
          }
          onClick={() => onSelect(candidate.method)}
        />
      ))}
      {method !== null && (
        <>
          <div className={separator} />
          <MergeActionRow
            label="Disable auto-merge"
            description="Stop automatic merging"
            disabled={pending}
            onClick={onDisable}
          />
        </>
      )}
    </div>
  );
}

export type MergeControlsState = {
  mergeableState: string;
  checksState: string;
  mergeBlockers: ReadonlyArray<string>;
};

export type MergeControlsProps = {
  pull: {
    id: string;
    state: string;
    baseRef: string;
    headSha: string;
    autoMergeMethod: MergeMethod | null;
    stack: PullStackForControls | null;
  };
  state: MergeControlsState;
  view: "merge" | "auto-merge" | "force-merge";
  onViewChange: (view: "merge" | "auto-merge" | "force-merge") => void;
  comment: string;
  onComment: (comment: string) => void;
  refusal: string | null;
  merging: boolean;
  onMerge: (method: MergeMethod, force: boolean, comment: string) => void;
  autoMergePending: boolean;
  onAutoMerge: (method: MergeMethod | null) => void;
  updateBranch: { offered: boolean; pending: boolean; onUpdate: () => void };
};

type PullStackForControls = {
  number: number | null;
  position: number;
  size: number;
  baseRef: string;
  members: ReadonlyArray<{
    id: string;
    number: number;
    title: string;
    position: number;
    state: PullState;
    headRef: string;
  }>;
};

/**
 * Capy's MergeControls: a button showing the merge verdict with a popover
 * holding the method picker, auto-merge and force-merge panels.
 */
export function MergeControls({
  pull,
  state,
  view,
  onViewChange,
  comment,
  onComment,
  refusal,
  merging,
  onMerge,
  autoMergePending,
  onAutoMerge,
  updateBranch,
}: MergeControlsProps) {
  const [open, setOpen] = useState(false);
  const gateInput = {
    open: pull.state !== "merged" && pull.state !== "closed",
    draft: pull.state === "draft",
    checksState: state.checksState,
    mergeableVerdict: state.mergeableState,
    blockers: state.mergeBlockers,
  };
  if (!gateInput.open) return null;
  const gate = merging ? null : mergeGate(gateInput);
  const autoBlocked = autoMergeBlocked(gateInput);
  const forceBlocked = forceMergeBlocked(gateInput);
  const stacked = pull.stack !== null;
  const position = stacked ? (pull.stack?.position ?? 1) : 1;
  const dirty = state.mergeableState === "dirty";
  const label = position > 1 ? `Merge ${position} pulls` : "Merge";
  const buttonLabel = dirty ? "Merge conflicts with the base branch" : label;
  const tooltip =
    gate ??
    (position > 1
      ? `Merge ${position} pulls into ${pull.stack?.baseRef ?? pull.baseRef}`
      : `Merge into ${pull.baseRef}`);
  const landing = landingPulls(pull.stack);
  const method = mergeMethods.find(
    (candidate) => candidate.method === pull.autoMergeMethod,
  );

  const panel = (() => {
    if (view === "auto-merge") {
      return (
        <NestedPanel
          label="Auto-merge"
          disabled={merging}
          onBack={() => onViewChange("merge")}
        >
          <AutoMergePanel
            method={pull.autoMergeMethod}
            pending={merging || autoMergePending}
            onSelect={onAutoMerge}
            onDisable={() => onAutoMerge(null)}
          />
        </NestedPanel>
      );
    }
    if (view === "force-merge") {
      return (
        <NestedPanel
          label="Force merge"
          disabled={merging}
          onBack={() => onViewChange("merge")}
        >
          <MergeMethodPanel
            commentLabel="Comment before force merging"
            comment={comment}
            onComment={onComment}
            disabled={merging || forceBlocked !== null}
            gate={null}
            gateDetails={[]}
            onMerge={(selected, text) => onMerge(selected, true, text)}
            landing={[]}
            trunk={null}
          />
        </NestedPanel>
      );
    }
    return (
      <>
        <MergeMethodPanel
          commentLabel="Comment before merging"
          comment={comment}
          onComment={onComment}
          disabled={merging || gate !== null}
          gate={gate}
          gateDetails={
            state.mergeBlockers.length > 0 && gate === gateBlockers(state)
              ? state.mergeBlockers
              : []
          }
          onMerge={(selected, text) => onMerge(selected, false, text)}
          landing={landing}
          trunk={pull.stack?.baseRef ?? null}
        />
        {!stacked && (
          <>
            <div className={separator} />
            {updateBranch.offered && (
              <MergeActionRow
                label="Update branch"
                description="Merge the latest base into this branch"
                disabled={merging || updateBranch.pending}
                onClick={updateBranch.onUpdate}
              />
            )}
            <MergeActionRow
              label={
                pull.autoMergeMethod === null
                  ? "Enable auto-merge"
                  : "Auto-merge"
              }
              description={
                pull.autoMergeMethod === null
                  ? (autoBlocked ?? "Merge when checks pass")
                  : "Merge when checks pass"
              }
              trailing={
                <span className="text-muted-foreground-1">
                  {method?.shortLabel}
                </span>
              }
              disabled={merging || autoMergePending}
              onClick={() => onViewChange("auto-merge")}
            />
            <MergeActionRow
              label="Force merge"
              description={forceBlocked ?? "Attempt before checks pass"}
              disabled={merging || forceBlocked !== null}
              onClick={() => onViewChange("force-merge")}
            />
          </>
        )}
      </>
    );
  })();

  return (
    <div className="relative">
      <div className="flex flex-col">
        <button
          type="button"
          aria-label={buttonLabel}
          disabled={refusal !== null}
          onClick={() => setOpen((current) => !current)}
          className={menuRowVariants({
            interaction: "button",
            density: "rich",
          })}
        >
          <span className={iconSlot}>
            {dirty ? (
              <PullGlyph
                name="shield-crossed"
                className="size-(--icon-sm) text-destructive"
              />
            ) : (
              <PullGlyph
                name="merged"
                className="size-(--icon-sm) text-success"
              />
            )}
          </span>
          <MenuRowContent
            label={dirty ? "Merge conflicts" : label}
            description={tooltip}
          />
          <PullGlyph
            name="chevron-down-small"
            className="size-(--icon-sm) text-muted-foreground-3"
          />
        </button>
      </div>
      {open && (
        <div className="absolute z-(--z-overlay-content) mt-1 w-72 rounded border border-border-1 bg-popover p-1">
          {panel}
        </div>
      )}
      {refusal !== null && (
        <p role="alert" className="px-2 pt-1 pb-1.5 text-xs text-destructive">
          {refusal}
        </p>
      )}
      {merging && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-popover p-3">
          <Spinner label="Merging" />
          <span className="text-xs font-medium text-foreground">Merging</span>
        </div>
      )}
    </div>
  );
}

const gateBlockers = (state: MergeControlsState) =>
  `Blocked on GitHub: ${state.mergeBlockers.join(", ")}`;

export type ClosePullDialogProps = {
  pull: { number: number; repo: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: string;
  onComment: (comment: string) => void;
  pending: boolean;
  voiceDisabled: boolean;
  onClose: () => void;
};

/** Confirmation dialog for closing a pull without merging it. */
export function ClosePullDialog({
  pull,
  open,
  onOpenChange,
  comment,
  onComment,
  pending,
  voiceDisabled,
  onClose,
}: ClosePullDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-pull-title"
      hidden={!open}
    >
      <h2 id="close-pull-title" className="font-medium">
        Close pull request
      </h2>
      <p className="text-sm text-muted-foreground-2">
        Closes {pull.repo}#{pull.number} without merging, reopen anytime
      </p>
      <textarea
        aria-label="Comment before closing"
        placeholder="Leave a comment (optional)"
        value={comment}
        disabled={pending}
        onChange={(event) => onComment(event.target.value)}
        onKeyDown={(event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key === "Enter" &&
            !pending &&
            !voiceDisabled
          ) {
            event.preventDefault();
            onClose();
          }
        }}
        className="min-h-12 w-full min-w-0 resize-y rounded bg-transparent p-2 text-sm outline-none"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || voiceDisabled}
          onClick={onClose}
        >
          Close pull request
        </button>
      </div>
    </div>
  );
}

/** Wires the merge controls to the pulls mutation atoms; errors toast verbatim. */
export function MergeControlsConnected({
  pull,
  orgId,
  state,
  onMerged,
}: {
  pull: Parameters<typeof MergeControls>[0]["pull"] & {
    id: string;
    repo: string;
    number: number;
  };
  orgId: string;
  state: MergeControlsState;
  onMerged?: () => void;
}) {
  const merge = useAtomSet(mergePullAtom, { mode: "promise" });
  const setAutoMerge = useAtomSet(setPullAutoMergeAtom, { mode: "promise" });
  const updateBranch = useAtomSet(updatePullBranchAtom, { mode: "promise" });
  const [view, setView] = useState<"merge" | "auto-merge" | "force-merge">(
    "merge",
  );
  const [comment, setComment] = useState("");
  const [merging, setMerging] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [branchPending, setBranchPending] = useState(false);
  const [autoPending, setAutoPending] = useState(false);
  const run = <T,>(
    work: Promise<T>,
    success: string,
    onSuccess?: (result: T) => void,
  ) => {
    setMerging(true);
    setRefusal(null);
    return work
      .then((result) => {
        toast.success(success);
        onSuccess?.(result);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "GitHub refused";
        setRefusal(message);
        toast.error("GitHub could not merge", { description: message });
      })
      .finally(() => setMerging(false));
  };
  return (
    <MergeControls
      pull={pull}
      state={state}
      view={view}
      onViewChange={setView}
      comment={comment}
      onComment={setComment}
      refusal={refusal}
      merging={merging}
      onMerge={(method, force, text) =>
        void run(
          merge({
            params: { orgId, pullId: pull.id },
            payload: {
              method,
              force,
              comment: text.trim() === "" ? undefined : text.trim(),
            },
            reactivityKeys: pullControlKeys(orgId, pull.id),
          }) as unknown as Promise<void>,
          "Merged",
          () => onMerged?.(),
        )
      }
      autoMergePending={autoPending}
      onAutoMerge={(method) => {
        setAutoPending(true);
        void setAutoMerge({
          params: { orgId, pullId: pull.id },
          payload:
            method === null ? { enabled: false } : { enabled: true, method },
          reactivityKeys: pullControlKeys(orgId, pull.id),
        })
          .then(() => {
            toast.success(
              method === null ? "Auto-merge disabled" : "Auto-merge enabled",
            );
            setView("merge");
          })
          .catch(() => toast.error("GitHub refused"))
          .finally(() => setAutoPending(false));
      }}
      updateBranch={{
        offered: state.mergeableState === "behind",
        pending: branchPending,
        onUpdate: () => {
          setBranchPending(true);
          void updateBranch({
            params: { orgId, pullId: pull.id },
            reactivityKeys: pullControlKeys(orgId, pull.id),
          })
            .then(() => toast.success("Branch update requested"))
            .catch(() => toast.error("GitHub refused"))
            .finally(() => setBranchPending(false));
        },
      }}
    />
  );
}
