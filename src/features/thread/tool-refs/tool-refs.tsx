import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { FileChip } from "@/components/markdown-chips/chips";
import {
  chipIconClass,
  chipLinkClass,
} from "@/components/markdown-chips/classes";
import { ThreadStatusIcon } from "@/components/markdown-chips/icons";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { idleThreadPageAtom, threadsAtom } from "@/data/atoms/threads";
import { PullRefLink } from "@/features/thread/pull-ref-link";
import { chipStatus } from "@/features/thread/thread-view/thread-chips";
import { refsInArgs, type ToolPullRef } from "./args-refs";

/**
 * The references a tool call's own payload names, drawn beside its label: a
 * thread the call pointed at, a pull it asked about, and the workspace file a
 * file tool names. A call that names
 * neither renders nothing at all, so the row keeps the shape it had.
 */

function ToolThreadRef({ threadId }: { threadId: string }) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const listed = Option.getOrUndefined(
    AsyncResult.value(
      useAtomValue(
        orgId === undefined ? idleThreadPageAtom : threadsAtom(orgId as OrgId),
      ),
    ),
  );
  const thread = listed?.items.find((card) => card.id === threadId);
  return (
    <Link
      data-slot="tool-thread-ref"
      to="/thread/$threadId"
      params={{ threadId }}
      className={cx(chipLinkClass, "whitespace-nowrap")}
      onClick={(event) => event.stopPropagation()}
    >
      {thread === undefined ? null : (
        <ThreadStatusIcon
          thread={{
            archived: thread.archived,
            status: chipStatus(thread.status),
          }}
          className={chipIconClass}
        />
      )}
      {thread?.title ?? threadId}
    </Link>
  );
}

function ToolPullRefChip({ pull }: { pull: ToolPullRef }) {
  return (
    <PullRefLink
      href={`https://github.com/${pull.repositoryFullName}/pull/${pull.number}`}
      onClick={(event) => event.stopPropagation()}
    >
      {`#${pull.number}`}
    </PullRefLink>
  );
}

export function ToolRefs({ args }: { args: unknown }) {
  const refs = useMemo(() => refsInArgs(args), [args]);
  if (
    refs.threadId === undefined &&
    refs.pull === undefined &&
    refs.file === undefined
  )
    return null;
  return (
    <span data-slot="tool-refs" className="kiki-tool-refs">
      {refs.threadId === undefined ? null : (
        <ToolThreadRef threadId={refs.threadId} />
      )}
      {refs.pull === undefined ? null : <ToolPullRefChip pull={refs.pull} />}
      {refs.file === undefined ? null : (
        <span data-slot="tool-file-ref">
          <FileChip value={refs.file} />
        </span>
      )}
    </span>
  );
}
