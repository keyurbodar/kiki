import { useState } from "react";
import {
  ChevronDownSmall,
  ChevronRightSmall,
  EditSmall,
} from "@/components/issue-parts";
import type { IssueDetail } from "@/data/api/schemas/issue";
import { Button } from "@/primitives/button";
import { IssueComposer } from "./issue-composer";
import type { IssueActions } from "./use-issue";

/** The collapsible description, read or edited in place. */
export function Description({
  detail,
  actions,
}: {
  detail: IssueDetail;
  actions: IssueActions;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = (text: string) => {
    setSaving(true);
    return actions
      .update({ description: text }, "Could not save the description")
      .then((saved) => {
        if (saved) setEditing(false);
        return saved;
      })
      .finally(() => setSaving(false));
  };
  return (
    <div className="group/description flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          className="-ml-2 w-fit"
          onClick={() => setOpen(!open)}
        >
          <span className="text-muted-foreground-2">Description</span>
          {open ? (
            <ChevronDownSmall className="text-icon-muted" />
          ) : (
            <ChevronRightSmall className="text-icon-muted" />
          )}
        </Button>
        <span className="min-w-0 flex-1" />
        {!editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Edit description"
            className="opacity-0 transition-opacity duration-100 group-hover/description:opacity-100 focus-visible:opacity-100"
            onClick={() => {
              setOpen(true);
              setEditing(true);
            }}
          >
            <EditSmall />
          </Button>
        )}
      </div>
      {open &&
        (editing ? (
          <div className="flex flex-col gap-1.5">
            <IssueComposer
              placeholder="Describe this issue"
              submitLabel="Save"
              defaultValue={detail.description}
              editorClassName="max-h-(--composer-editor-tall-max-h)"
              disabled={saving}
              autoFocus
              onSubmit={save}
            />
            <Button
              variant="ghost"
              size="xs"
              className="w-fit self-end"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        ) : detail.description === "" ? (
          <span className="px-0.5 text-sm text-muted-foreground-2">
            No description
          </span>
        ) : (
          <div
            className="flex flex-col gap-2"
            data-quote-key={`issue:${detail.issue.code}`}
            data-quote-label={`${detail.issue.code} description`}
          >
            <p className="px-0.5 text-sm whitespace-pre-wrap text-foreground">
              {detail.description}
            </p>
          </div>
        ))}
    </div>
  );
}
