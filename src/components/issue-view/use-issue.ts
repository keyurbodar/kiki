import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult, type Atom } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssueDetail,
  IssueLinkTarget,
  IssueRelationKind,
  UpdateIssueRequest,
} from "@/data/api/schemas/issue";
import { idleAtom } from "@/data/atoms/idle";
import {
  issueAtom,
  linkIssueAtom,
  relateIssueAtom,
  unlinkIssueAtom,
  unrelateIssueAtom,
  updateIssueAtom,
} from "@/data/atoms/issues";
import { issueMenuKeys } from "@/features/issues/issue-menu";
import { useIssueOrgId } from "@/features/issues/issue-parts";
import { toast } from "@/primitives/toaster";
import { commentIssueAtom } from "./atoms";

const idleIssue = idleAtom<IssueDetail>();

/** The issue's detail, `undefined` while it loads, and whether it is missing. */
export function useIssueDetail(code: string) {
  const orgId = useIssueOrgId();
  const atom: Atom.Atom<AsyncResult.AsyncResult<IssueDetail, unknown>> =
    orgId === undefined ? idleIssue : issueAtom(orgId, code);
  const result = useAtomValue(atom);
  if (orgId === undefined) {
    return { orgId, detail: undefined, missing: false } as const;
  }
  return {
    orgId,
    detail: AsyncResult.isSuccess(result) ? result.value : undefined,
    missing: AsyncResult.isFailure(result),
  } as const;
}

/** The reactivity keys an issue write refreshes. */
export const issueKeys = issueMenuKeys;

/**
 * The writes an issue view makes, each reporting its own failure as a toast.
 * `update` resolves to whether the write landed.
 */
export function useIssueActions(detail: IssueDetail, orgId: OrgId) {
  const code = detail.issue.code;
  const reactivityKeys = issueKeys(orgId, code);
  const params = { orgId, code };
  const update = useAtomSet(updateIssueAtom, { mode: "promise" });
  const link = useAtomSet(linkIssueAtom, { mode: "promise" });
  const unlink = useAtomSet(unlinkIssueAtom, { mode: "promise" });
  const relate = useAtomSet(relateIssueAtom, { mode: "promise" });
  const unrelate = useAtomSet(unrelateIssueAtom, { mode: "promise" });
  const comment = useAtomSet(commentIssueAtom, { mode: "promise" });
  const fail = (message: string) => () => {
    toast.error(message);
    return false;
  };
  return {
    update: (payload: UpdateIssueRequest, failure: string) =>
      update({ params, payload, reactivityKeys }).then(
        () => true,
        fail(failure),
      ),
    link: (ref: string) =>
      link({ params, payload: { ref }, reactivityKeys }).then(
        () => true,
        fail(`Could not link ${ref}`),
      ),
    unlink: (target: IssueLinkTarget) =>
      unlink({ params, payload: { target }, reactivityKeys }).then(
        () => true,
        fail("Could not unlink"),
      ),
    relate: (relation: IssueRelationKind, issue: string) =>
      relate({ params, payload: { relation, issue }, reactivityKeys }).then(
        () => true,
        fail(`Could not relate ${issue}`),
      ),
    unrelate: (issue: string) =>
      unrelate({ params, payload: { issue }, reactivityKeys }).then(
        () => true,
        fail("Could not remove the relation"),
      ),
    comment: (body: string, replyTo?: IssueDetail["comments"][number]["id"]) =>
      comment({
        params,
        payload: replyTo === undefined ? { body } : { body, replyTo },
        reactivityKeys,
      }).then(() => true, fail("Could not send the comment")),
  };
}

export type IssueActions = ReturnType<typeof useIssueActions>;
