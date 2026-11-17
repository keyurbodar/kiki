import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  formatTokens,
  type ModelEntry,
  parseTokens,
} from "../model-defaults/model-selection";

export const minimumCompactAt = 50_000;

export function validateCompactAt(
  raw: string,
  isUser: boolean,
  max: number,
): { value: number | null; error?: string } {
  const value = parseTokens(raw);
  if (raw.replaceAll(",", "").trim() === "") return { value: null };
  if (value === null)
    return {
      value: null,
      error: isUser
        ? `Enter between ${formatTokens(minimumCompactAt)} and ${formatTokens(max)} tokens, or leave empty for the default`
        : `Enter at least ${formatTokens(minimumCompactAt)} tokens, or leave empty for the default`,
    };
  if (value < minimumCompactAt || (isUser && value > max))
    return {
      value,
      error: isUser
        ? `Enter between ${formatTokens(minimumCompactAt)} and ${formatTokens(max)} tokens, or leave empty for the default`
        : `Enter at least ${formatTokens(minimumCompactAt)} tokens, or leave empty for the default`,
    };
  return { value };
}

export function CompactAtDialog({
  entry,
  scope,
  value,
  onClose,
  onSave,
}: {
  entry: ModelEntry;
  scope: "user" | "org";
  value: number | undefined;
  onClose: () => void;
  onSave: (compactAt: number | null) => Promise<void>;
}) {
  const isUser = scope === "user";
  const builtIn = Math.round((entry.context ?? 200_000) * 0.8);
  const floor = isUser ? Math.min(builtIn, 400_000) : builtIn;
  const max = isUser ? (entry.context ?? 200_000) : Number.POSITIVE_INFINITY;
  const [raw, setRaw] = useState(
    value === undefined ? "" : formatTokens(value),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = validateCompactAt(raw, isUser, max);
    if (parsed.error !== undefined) {
      toast.error(parsed.error);
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.value);
      toast.success("Model settings saved");
      onClose();
    } catch {
      toast.error("Could not update compact at");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUser
              ? "Compact at (your threads)"
              : "Compact at (organization default)"}
          </DialogTitle>
          <DialogDescription>
            {isUser
              ? "Your default for threads you own"
              : "For everyone without their own value"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <label
            htmlFor="compact-at-tokens"
            className="flex flex-col gap-1 text-xs text-muted-foreground-1"
          >
            Tokens
            <Input
              id="compact-at-tokens"
              type="text"
              inputMode="numeric"
              placeholder={formatTokens(floor)}
              value={raw}
              onChange={(event) => setRaw(event.currentTarget.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground-2 tabular-nums">
            {isUser
              ? `Organization default is ${formatTokens(floor)}, up to ${formatTokens(max)} tokens`
              : `Built-in default is ${formatTokens(floor)}, at least ${formatTokens(minimumCompactAt)} tokens`}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={() => void save()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
