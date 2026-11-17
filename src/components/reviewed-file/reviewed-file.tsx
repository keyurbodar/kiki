import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  pullReactivityKeys,
  pullViewedFilesAtom,
  setFileViewedAtom,
} from "@/components/diff-tab/atoms";
import type { PullRef } from "@/components/diff-tab/model";
import { Checkbox } from "@/primitives/checkbox";
import {
  normalizeViewedFiles,
  type PendingReview,
  settlePending,
  viewedPathsFor,
} from "./viewed";

export function useViewedPaths(
  pull: Pick<PullRef, "id" | "orgId" | "headSha">,
) {
  const result = useAtomValue(pullViewedFilesAtom(pull.orgId, pull.id));
  const value = AsyncResult.value(result);
  return {
    paths: Option.isSome(value)
      ? viewedPathsFor(normalizeViewedFiles(value.value), pull.headSha)
      : null,
    waiting: result.waiting,
  };
}

export type ReviewedCheckboxProps = {
  pull: PullRef;
  path: string;
  onChecked: (path: string, checked: boolean) => void;
};

export function ReviewedCheckbox({
  pull,
  path,
  onChecked,
}: ReviewedCheckboxProps) {
  const { paths, waiting } = useViewedPaths(pull);
  const setViewed = useAtomSet(setFileViewedAtom, { mode: "promise" });
  const [pending, setPending] = useState<PendingReview | null>(null);
  const counter = useRef(0);
  const stored = paths?.has(path) ?? null;

  useEffect(() => {
    setPending((current) => settlePending(current, stored, waiting));
  }, [stored, waiting]);

  if (paths === null) return null;
  const checked = pending?.value ?? paths.has(path);

  const onCheckedChange = (value: boolean) => {
    if (pending !== null) return;
    counter.current += 1;
    const id = counter.current;
    setPending({ id, value, written: false });
    onChecked(path, value);
    setViewed({
      params: { orgId: pull.orgId, pullId: pull.id },
      payload: { headSha: pull.headSha, path, viewed: value },
      reactivityKeys: [pullReactivityKeys.fileViews(pull.id)],
    })
      .then(() =>
        setPending((current) =>
          current === null || current.id !== id
            ? current
            : { ...current, written: true },
        ),
      )
      .catch((error: unknown) => {
        setPending((current) =>
          current === null || current.id !== id ? current : null,
        );
        onChecked(path, !value);
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save reviewed state",
        );
      });
  };

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the Base UI checkbox inside is the control
    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground-2 select-none">
      <span className="@max-md/file-header:sr-only">Reviewed</span>
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
