import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Exit } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDownSmallIcon,
  PullRequestIcon,
} from "@/components/pull-view/icons";
import { localPullsAtom, removeLocalPullAtom } from "./atoms";
import {
  decodeLocalPulls,
  groupLocalPulls,
  type LocalPull,
  repoName,
} from "./data";

/** Local pulls for a thread, grouped by repository (Capy's LocalPullsSection). */
export function LocalPullsSection({
  orgId,
  threadId,
  onOpenConnect,
}: {
  orgId: string;
  threadId: string;
  onOpenConnect?: () => void;
}) {
  const result = useAtomValue(localPullsAtom(`${orgId}|${threadId}`));
  const pulls = AsyncResult.isSuccess(result)
    ? decodeLocalPulls(result.value)
    : [];
  const groups = groupLocalPulls(pulls);
  const offline = AsyncResult.isFailure(result);
  return (
    <div
      data-slot="local-pulls-section"
      className="@container/list flex flex-col px-2"
    >
      {groups.map((group) => (
        <LocalRepoPulls
          key={group.repo}
          repo={group.repo}
          pulls={group.pulls}
          orgId={orgId}
          offline={offline}
        />
      ))}
      {!offline && pulls.length === 0 && onOpenConnect === undefined ? (
        <span className="flex h-11 items-center pl-10 text-sm font-normal text-muted-foreground-3">
          No open pull requests
        </span>
      ) : null}
      {offline && onOpenConnect !== undefined ? (
        <button
          type="button"
          onClick={onOpenConnect}
          className="flex h-11 w-full cursor-pointer items-center gap-0.5 rounded pl-10 text-left text-sm text-(--text-link) outline-none hover:underline underline-offset-2 focus-visible:outline-ring-inset"
        >
          Manage GitHub access
        </button>
      ) : null}
    </div>
  );
}

function LocalRepoPulls({
  repo,
  pulls,
  orgId,
  offline,
}: {
  repo: string;
  pulls: ReadonlyArray<LocalPull>;
  orgId: string;
  offline: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-(--radius-card) px-2 text-sm font-medium text-foreground"
      >
        <ChevronDownSmallIcon
          className={[
            "size-(--icon-xs) shrink-0 text-muted-foreground-3 transition-transform duration-100",
            open ? "" : "-rotate-90",
          ].join(" ")}
        />
        <span className="truncate">{repoName(repo)}</span>
        <span className="flex shrink-0 items-center gap-1.5 pr-1 text-xs font-normal text-muted-foreground-2">
          {offline ? "Offline" : pulls.length}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col pt-1">
          {pulls.map((pull) => (
            <LocalPullRow key={pull.id} pull={pull} orgId={orgId} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function LocalPullRow({ pull, orgId }: { pull: LocalPull; orgId: string }) {
  const remove = useAtomSet(removeLocalPullAtom, { mode: "promiseExit" });
  const [owner = "", name = pull.repo] = pull.repo.split("/");
  return (
    <div className="group/row flex h-11 items-center gap-2 rounded px-2 text-sm">
      <PullRequestIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-2" />
      <Link
        to="/pull/$owner/$repo/$prNumber"
        params={{ owner, repo: name, prNumber: String(pull.number) }}
        className="min-w-0 flex-1 truncate text-foreground outline-none hover:underline focus-visible:outline-ring-inset"
      >
        {pull.title}
      </Link>
      <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
        #{pull.number}
      </span>
      <button
        type="button"
        aria-label={`Remove local pull ${pull.number}`}
        onClick={() => {
          void remove({
            params: { orgId, jamId: pull.threadId ?? "", id: pull.id },
            reactivityKeys: [`pulls:${orgId}`],
          }).then((exit) => {
            if (!Exit.isSuccess(exit)) {
              toast.error("Action failed", { description: pull.title });
              return;
            }
            toast.success(`Removed #${pull.number}`, {
              description: pull.title,
            });
          });
        }}
        className="shrink-0 rounded px-1 text-xs text-muted-foreground-2 opacity-0 outline-none group-hover/row:opacity-100 focus-visible:outline-ring-inset"
      >
        Remove
      </button>
    </div>
  );
}
