import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { PullView } from "@/components/pull-view";
import { pullByNumberAtom } from "@/components/pull-view/atoms";
import { usePullOrgId } from "@/components/pull-view/context";
import { toPull } from "@/components/pull-view/pull-model";
import { PullStateIcon } from "@/components/pull-view/pull-parts";
import { resultValue } from "@/components/pull-view/result";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import { Textarea } from "@/primitives/textarea";

const shortRepoName = (repo: string) => repo.slice(repo.indexOf("/") + 1);

export type PullPreviewProps = {
  pullId?: string;
  repo?: string;
  number?: number;
  org?: string;
  onClose?: () => void;
  onOpenPull?: (pull: { repo: string; number: number; url: string }) => void;
};

const shortLabel = (repo: string, number: number) =>
  `${shortRepoName(repo)}#${number}`;

/** The pull preview panel's header (Capy's local and remote panel headers). */
function PreviewHeader({
  repo,
  number,
  onClose,
}: {
  repo: string;
  number: number;
  onClose?: () => void;
}) {
  const [owner = "", name = repo] = repo.split("/");
  return (
    <div className="flex min-h-11 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2">
      <span className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <span className="mask-fade-r min-w-0 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
          {shortLabel(repo, number)}
        </span>
      </span>
      <Link
        to="/pull/$owner/$repo/$prNumber"
        params={{ owner, repo: name, prNumber: String(number) }}
        aria-label="Open pull request"
        className="flex size-(--h-control-sm) items-center justify-center rounded text-icon-muted outline-none hover:bg-button-hover focus-visible:outline-ring-inset"
      >
        <span aria-hidden>↗</span>
      </Link>
      {onClose === undefined ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close pull panel"
          onClick={onClose}
        >
          <span aria-hidden>×</span>
        </Button>
      )}
    </div>
  );
}

function RemotePullPreview({
  orgId,
  repo,
  number,
  onOpenPull,
}: {
  orgId: string;
  repo: string;
  number: number;
  onOpenPull?: (pull: { repo: string; number: number; url: string }) => void;
}) {
  const result = useAtomValue(pullByNumberAtom(orgId, repo, number));
  const raw = resultValue(result);
  const pull = raw === undefined ? undefined : toPull(raw);
  if (pull === undefined) {
    return (
      <div className="flex min-h-11 items-center px-4 text-sm text-muted-foreground-2">
        {AsyncResult.isFailure(result) ? "Pull request unavailable" : "Loading"}
      </div>
    );
  }
  const url = pull.url || `https://github.com/${repo}/pull/${number}`;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 shrink-0 items-center gap-1.5 px-3">
        <PullStateIcon state={pull.state} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {pull.title}
        </span>
        {onOpenPull === undefined ? null : (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onOpenPull({ repo, number, url })}
          >
            Open in panel
          </Button>
        )}
      </div>
      <PullView pull={pull} host="panel" />
    </div>
  );
}

function LocalPullPreview({
  title,
  state,
  body,
  onSave,
  onClose,
}: {
  title: string;
  state: string;
  body: string;
  onSave?: (body: string) => void;
  onClose?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(body);
  const [saved, setSaved] = useState(body);
  const [draft, setDraft] = useState(state === "draft");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 shrink-0 items-center gap-1.5 px-3">
        <PullStateIcon
          state={
            state === "draft" ||
            state === "merged" ||
            state === "closed" ||
            state === "ready"
              ? state
              : "ready"
          }
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
        <h3 className="text-sm font-medium">Description</h3>
        {editing ? (
          <>
            <Textarea
              aria-label="Description"
              placeholder="Describe this pull request"
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              className="min-h-20"
            />
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={() => {
                  setSaved(draftBody);
                  onSave?.(draftBody);
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setDraftBody(saved);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground-1">
              {saved === "" ? "No description" : saved}
            </p>
            <Button variant="ghost" size="xs" onClick={() => setEditing(true)}>
              Edit description
            </Button>
          </>
        )}
        <span className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            aria-label="Draft"
            checked={draft}
            onCheckedChange={(checked) => setDraft(checked === true)}
          />
          Draft
        </span>
        {onClose === undefined ? null : (
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close panel
          </Button>
        )}
      </div>
    </div>
  );
}

/** Pull preview panel: a remote pull, or a local pull before it is published. */
export function PullPreview({
  pullId,
  repo,
  number,
  org,
  onClose,
  onOpenPull,
  ...props
}: PullPreviewProps) {
  const contextOrg = usePullOrgId();
  const orgId = contextOrg === "" ? org : contextOrg;
  if (pullId !== undefined) {
    return (
      <div data-slot="pull-preview" {...props}>
        <PreviewHeader
          repo={repo ?? ""}
          number={number ?? 0}
          onClose={onClose}
        />
        {orgId === undefined || repo === undefined || number === undefined ? (
          <div className="flex min-h-11 items-center px-4 text-sm text-muted-foreground-2">
            No organization selected
          </div>
        ) : (
          <RemotePullPreview
            orgId={orgId}
            repo={repo}
            number={number}
            onOpenPull={onOpenPull}
          />
        )}
      </div>
    );
  }
  if (repo === undefined || number === undefined) {
    return (
      <div data-slot="pull-preview" {...props}>
        <div className="flex min-h-11 items-center px-4 text-sm text-muted-foreground-2">
          No pull request
        </div>
      </div>
    );
  }
  return (
    <div data-slot="pull-preview" {...props}>
      <PreviewHeader repo={repo} number={number} onClose={onClose} />
      <LocalPullPreview
        title={shortLabel(repo, number)}
        state="draft"
        body=""
        onClose={onClose}
      />
    </div>
  );
}
