import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  createPayload,
  draftProblems,
  emptyDraft,
  type NewProjectDraft,
  type NewProjectRepo,
  withCode,
  withName,
  withRepo,
} from "./draft";

export type NewProjectDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly repos: ReadonlyArray<NewProjectRepo>;
  readonly onCreate: (
    payload: ReturnType<typeof createPayload>,
  ) => Promise<unknown>;
  readonly initialName?: string;
};

export function NewProjectDialog({
  open,
  onOpenChange,
  repos,
  onCreate,
  initialName,
}: NewProjectDialogProps) {
  const [draft, setDraft] = useState<NewProjectDraft>(() =>
    initialName === undefined
      ? emptyDraft()
      : withName(emptyDraft(), initialName),
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const problems = draftProblems(draft);
  const invalid = (problem: (typeof problems)[number]) =>
    submitted && problems.includes(problem);
  const query = draft.name.trim().toLowerCase();

  const submit = () => {
    setSubmitted(true);
    if (problems.length > 0) return;
    setSaving(true);
    onCreate(createPayload(draft, repos))
      .then(() => onOpenChange(false))
      .catch(() => undefined)
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className="max-w-lg">
        {open && (
          <>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Pick the repositories a machine clones, then name the project
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Name
                </span>
                <Input
                  aria-label="Project name"
                  aria-invalid={invalid("name") || undefined}
                  maxLength={255}
                  value={draft.name}
                  placeholder="Web app"
                  onChange={(event) =>
                    setDraft(withName(draft, event.target.value))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Thread code
                </span>
                <Input
                  aria-label="Thread code"
                  aria-invalid={invalid("code") || undefined}
                  className="w-24 uppercase"
                  size="sm"
                  maxLength={4}
                  value={draft.code}
                  placeholder="WEB"
                  onChange={(event) =>
                    setDraft(withCode(draft, event.target.value))
                  }
                />
                <span className="text-xs text-muted-foreground-2">
                  Prefixes thread numbers, like {draft.code || "WEB"}-12
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Repositories
                </span>
                <ul className="flex max-h-64 flex-col overflow-y-auto rounded border-[0.03125rem] border-border-2 divide-y-hairline divide-border-1">
                  {repos.length === 0 ? (
                    <li className="p-4 text-center text-sm font-normal text-muted-foreground-2">
                      Install the Capy GitHub App to pick repositories
                    </li>
                  ) : (
                    repos
                      .filter(
                        (repo) =>
                          query === "" ||
                          repo.repoFullName.toLowerCase().includes(query),
                      )
                      .map((repo) => {
                        const selected = draft.repos.includes(
                          repo.repoFullName,
                        );
                        return (
                          <li key={repo.repoFullName}>
                            <button
                              type="button"
                              aria-pressed={selected}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground outline-none select-none hover:bg-secondary focus-visible:outline-ring-inset"
                              onClick={() =>
                                setDraft(
                                  withRepo(draft, repo.repoFullName, !selected),
                                )
                              }
                            >
                              <Icon name="globe" className="size-4 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">
                                {repo.repoFullName}
                              </span>
                              {selected && (
                                <span className="text-xs text-muted-foreground-2">
                                  Added
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })
                  )}
                </ul>
                {invalid("repos") && (
                  <span className="text-xs text-destructive">
                    Pick at least one repository
                  </span>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                intent="accent"
                type="button"
                loading={saving}
                onClick={submit}
              >
                Create project
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
