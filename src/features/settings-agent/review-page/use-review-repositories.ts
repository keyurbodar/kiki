import { useAtomSet } from "@effect/atom-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { OrgId } from "@/data/api/schemas/ids";
import { projectsAtom } from "@/data/atoms/projects";
import {
  configureReviewAtom,
  reviewReactivityKeys,
  reviewSettingsAtom,
} from "@/data/atoms/reviews";
import {
  type AutoReviewMode,
  heldElsewhere,
  type ReviewSetting,
  setAllFailureMessage,
} from "./review-model";
import { useQuery } from "./review-shared";

/** Capy's useReviewRepositories: rows, projects and the serialised writes. */
export function useReviewRepositories(orgId: OrgId) {
  const rows = useQuery(reviewSettingsAtom(orgId)).value as
    | ReadonlyArray<ReviewSetting>
    | undefined;
  const projects = useQuery(projectsAtom(orgId)).value;
  const configure = useAtomSet(configureReviewAtom, { mode: "promise" });
  const [pending, setPending] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );
  const [allBusy, setAllBusy] = useState(false);
  const [statusChecks, setStatusChecks] = useState<
    ReadonlyMap<string, boolean>
  >(() => new Map());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const statusTokens = useRef(new Map<string, number>());

  useEffect(() => {
    void orgId;
    setStatusChecks(new Map());
  }, [orgId]);

  useEffect(() => {
    if (rows === undefined || statusChecks.size === 0) return;
    const settled = rows.filter(
      (row) => statusChecks.get(row.repo) === row.postStatusCheck,
    );
    if (settled.length === 0) return;
    setStatusChecks((current) => {
      const next = new Map(current);
      for (const row of settled) next.delete(row.repo);
      return next;
    });
  }, [rows, statusChecks]);

  const write = (payload: Record<string, unknown>) => {
    const run = queue.current.then(() =>
      configure({
        params: { orgId },
        payload,
        reactivityKeys: [reviewReactivityKeys.settings(orgId)],
      }),
    );
    queue.current = run.catch(() => undefined);
    return run;
  };

  const track = (repo: string, delta: number) =>
    setPending((current) => {
      const next = new Map(current);
      const count = (current.get(repo) ?? 0) + delta;
      if (count > 0) next.set(repo, count);
      else next.delete(repo);
      return next;
    });

  const setMode = (repo: string, autoReview: AutoReviewMode) => {
    track(repo, 1);
    write({ repo, autoReview })
      .catch(() => toast.error("Could not update automatic reviews"))
      .finally(() => track(repo, -1));
  };

  const setProject = (repo: string, projectId: string) => {
    track(repo, 1);
    write({ repo, projectId })
      .catch(() => toast.error("Could not update the review's project memory"))
      .finally(() => track(repo, -1));
  };

  const setStatusCheck = (repo: string, postStatusCheck: boolean) => {
    const token = (statusTokens.current.get(repo) ?? 0) + 1;
    statusTokens.current.set(repo, token);
    setStatusChecks((current) => new Map(current).set(repo, postStatusCheck));
    write({ repo, postStatusCheck }).catch(() => {
      if (statusTokens.current.get(repo) !== token) return;
      setStatusChecks((current) => {
        const next = new Map(current);
        next.delete(repo);
        return next;
      });
      toast.error("Could not update the status check");
    });
  };

  const setAll = async (
    targets: ReadonlyArray<ReviewSetting>,
    autoReview: AutoReviewMode,
  ) => {
    const changing = targets.filter(
      (row) => !heldElsewhere(row) && row.autoReview !== autoReview,
    );
    if (changing.length === 0) return;
    setAllBusy(true);
    const failed: string[] = [];
    for (const row of changing)
      await write({ repo: row.repo, autoReview }).catch(() =>
        failed.push(row.repo),
      );
    setAllBusy(false);
    if (failed.length > 0) toast.error(setAllFailureMessage(failed));
  };

  return {
    rows,
    projects,
    pending,
    allBusy,
    statusChecks,
    setMode,
    setProject,
    setStatusCheck,
    setAll,
  };
}
