import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import { useId, useState } from "react";
import { contextUsageAtom, jamEventKey } from "@/data/atoms/events";
import {
  setThreadCompactAtAtom,
  threadDeviceKeys,
  upsertMyCompactAtAtom,
} from "@/data/atoms/thread-devices";
import { LoadingButton } from "@/lib/loading-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { toast } from "@/primitives/toaster";
import {
  compactAtHint,
  compactAtRangeError,
  formatTokens,
  parseCompactAt,
} from "./compact-at";

export type ThreadCompactAtDialogProps = {
  orgId: string | undefined;
  jamId: string;
  compactAt: number;
  defaultCompactAt: number;
  windowTokens: number;
  threadCompactAt?: number;
  model?: string;
  viewerOwnsThread?: boolean;
  onClose: () => void;
};

export function ThreadCompactAtDialog({
  orgId,
  jamId,
  compactAt,
  defaultCompactAt,
  windowTokens,
  threadCompactAt,
  model,
  viewerOwnsThread = false,
  onClose,
}: ThreadCompactAtDialogProps) {
  const refreshContext = useAtomRefresh(contextUsageAtom(orgId ?? "", jamId));
  const setThreadCompactAt = useAtomSet(setThreadCompactAtAtom, {
    mode: "promise",
  });
  const upsertMyCompactAt = useAtomSet(upsertMyCompactAtAtom, {
    mode: "promise",
  });
  const [value, setValue] = useState(() => formatTokens(Math.round(compactAt)));
  const [saving, setSaving] = useState(false);
  const inputId = useId();
  const defaultTokens = Math.round(defaultCompactAt);
  const maxTokens = Math.round(windowTokens);
  const reactivityKeys = [jamEventKey(jamId), threadDeviceKeys.jam(jamId)];

  const commit = (tokens: number | null) => {
    if (orgId === undefined) return;
    setSaving(true);
    setThreadCompactAt({
      params: { orgId, jamId },
      payload: { compactAt: tokens },
      reactivityKeys,
    })
      .then(() => {
        toast.success("Thread settings saved");
        refreshContext();
        onClose();
      })
      .catch(() => toast.error("Could not update compact at"))
      .finally(() => setSaving(false));
  };

  const save = () => {
    const parsed = parseCompactAt(value, maxTokens);
    if (parsed.kind === "empty") return commit(null);
    if (parsed.kind === "invalid") return toast.error(parsed.message);
    commit(parsed.tokens === defaultTokens ? null : parsed.tokens);
  };

  const saveAsDefault = () => {
    if (orgId === undefined || model === undefined) return;
    const parsed = parseCompactAt(value, maxTokens);
    if (parsed.kind !== "ok") {
      toast.error(compactAtRangeError(maxTokens));
      return;
    }
    setSaving(true);
    upsertMyCompactAt({
      params: { orgId },
      payload: { model, compactAt: parsed.tokens },
      reactivityKeys: [threadDeviceKeys.myCompactAt(orgId)],
    })
      .then(
        () => {
          toast.success("Your default saved");
          refreshContext();
          onClose();
          if (threadCompactAt !== undefined && viewerOwnsThread) {
            setThreadCompactAt({
              params: { orgId, jamId },
              payload: { compactAt: null },
              reactivityKeys,
            }).catch(() =>
              toast.error("Could not clear this thread's compact at"),
            );
          }
        },
        () => toast.error("Could not update compact at"),
      )
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compact at (this thread)</DialogTitle>
          <DialogDescription>Applies to this thread only</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3 py-4">
          <label
            htmlFor={inputId}
            className="flex flex-col gap-1 text-xs text-muted-foreground"
          >
            Tokens
            <Input
              id={inputId}
              type="text"
              inputMode="numeric"
              placeholder={formatTokens(defaultTokens)}
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground-2 tabular-nums">
            {compactAtHint(defaultTokens, maxTokens)}
          </p>
        </DialogBody>
        <DialogFooter className="flex-wrap">
          <div className="mr-auto max-sm:basis-full">
            <LoadingButton
              variant="ghost"
              size="sm"
              disabled={threadCompactAt === undefined || saving}
              onClick={() => commit(null)}
            >
              Reset to default
            </LoadingButton>
          </div>
          <LoadingButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </LoadingButton>
          {model !== undefined && (
            <LoadingButton
              variant="outline"
              size="sm"
              disabled={saving}
              title="Save as your default for threads you own"
              onClick={saveAsDefault}
            >
              Save as my default
            </LoadingButton>
          )}
          <LoadingButton size="sm" loading={saving} onClick={save}>
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
