import { Field } from "@base-ui/react/field";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  cx,
  menuCheckClassName,
  menuIconSlotClassName,
} from "@/components/view-toolbar";
import {
  BranchGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  PullRequestGlyph,
} from "@/features/pulls/pulls-list/pull-row/pull-icons";
import {
  installationReposAtom,
  pullBranchesAtom,
} from "@/features/pulls/pulls-page/data/atoms";
import {
  decodeBranches,
  decodeInstallationRepos,
  type InstallationRepo,
} from "@/features/pulls/pulls-page/data/pull";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
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
import { Label } from "@/primitives/label";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSearchRow,
  MenuTrigger,
} from "@/primitives/menu";
import { Textarea } from "@/primitives/textarea";

export interface NewPullInput {
  readonly repo: InstallationRepo;
  readonly baseBranch: string;
  readonly headBranch: string;
  readonly title: string;
  readonly body: string;
  readonly draft: boolean;
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Field.Root className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </Field.Root>
  );
}

/** A repository's initial, as Capy shows its owner avatar when none is available. */
function RepoAvatar({ fullName }: { fullName: string }) {
  return (
    <span
      aria-hidden
      className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-[0.5rem] font-medium text-muted-foreground-1 uppercase"
    >
      {fullName.slice(0, 1)}
    </span>
  );
}

function Check() {
  return (
    <span className={cx("ml-auto", menuCheckClassName)}>
      <CheckGlyph />
    </span>
  );
}

/** The repository button and its searchable menu (Capy's RepositoryPicker). */
export function RepositoryPicker({
  repos,
  value,
  onChange,
}: {
  repos: ReadonlyArray<InstallationRepo>;
  value: InstallationRepo | undefined;
  onChange: (fullName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const shown =
    term === ""
      ? repos
      : repos.filter((repo) => repo.fullName.toLowerCase().includes(term));
  return (
    <Menu
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <MenuTrigger
        render={
          <Button
            variant="solid"
            size="base"
            className="w-full justify-start"
            aria-label="Repository"
          />
        }
      >
        {value === undefined ? null : <RepoAvatar fullName={value.fullName} />}
        <span className="min-w-0 truncate">
          {value === undefined ? "Select repository" : value.fullName}
        </span>
        <ChevronDownGlyph className="ml-auto size-(--icon-sm) shrink-0 text-muted-foreground-3" />
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        <MenuSearchRow>
          <input
            className="h-7 w-full min-w-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
            placeholder="Search repositories"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </MenuSearchRow>
        {shown.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground-2">
            No repositories found
          </div>
        ) : (
          shown.map((repo) => (
            <MenuItem
              key={repo.fullName}
              onClick={() => onChange(repo.fullName)}
            >
              <span className={menuIconSlotClassName}>
                <PullRequestGlyph />
              </span>
              {repo.fullName}
              {value?.fullName === repo.fullName ? <Check /> : null}
            </MenuItem>
          ))
        )}
      </MenuContent>
    </Menu>
  );
}

function BranchItems({
  orgId,
  repo,
  value,
  onChange,
}: {
  orgId: string;
  repo: InstallationRepo;
  value: string;
  onChange: (branch: string) => void;
}) {
  const result = useAtomValue(pullBranchesAtom(orgId, repo.fullName));
  const branches = AsyncResult.isSuccess(result)
    ? decodeBranches(result.value, repo.fullName)
    : [];
  return branches.map((branch) => (
    <MenuItem key={branch} onClick={() => onChange(branch)}>
      <span className={menuIconSlotClassName}>
        <BranchGlyph />
      </span>
      <span className="min-w-0 truncate">{branch}</span>
      {value === branch ? <Check /> : null}
    </MenuItem>
  ));
}

/** A branch button and its menu of the repository's branches (Capy's BranchPicker). */
export function BranchPicker({
  orgId,
  repo,
  value,
  label,
  onChange,
}: {
  orgId: string;
  repo: InstallationRepo | undefined;
  value: string;
  label: string;
  onChange: (branch: string) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="solid"
            size="base"
            className="w-full justify-start"
            aria-label={label}
            disabled={repo === undefined}
          />
        }
      >
        <BranchGlyph className="size-(--icon-sm)" />
        <span className="min-w-0 truncate">
          {value === "" ? "Select branch" : value}
        </span>
        <ChevronDownGlyph className="ml-auto size-(--icon-sm) shrink-0 text-muted-foreground-3" />
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        {repo === undefined ? null : (
          <BranchItems
            orgId={orgId}
            repo={repo}
            value={value}
            onChange={onChange}
          />
        )}
      </MenuContent>
    </Menu>
  );
}

/** "New pull request" dialog (Capy's NewPullDialog). */
export function NewPullDialog({
  orgId,
  open,
  onOpenChange,
  onCreate,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewPullInput) => Promise<unknown>;
}) {
  const reposResult = useAtomValue(installationReposAtom(orgId));
  const repos = AsyncResult.isSuccess(reposResult)
    ? decodeInstallationRepos(reposResult.value)
    : [];
  const [repoName, setRepoName] = useState("");
  const repo =
    repos.find((candidate) => candidate.fullName === repoName) ?? repos[0];
  const [base, setBase] = useState("");
  const [head, setHead] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [draft, setDraft] = useState(true);
  const [creating, setCreating] = useState(false);
  const seeded = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (repo === undefined || seeded.current === repo.fullName) return;
    seeded.current = repo.fullName;
    setRepoName(repo.fullName);
    setBase(repo.defaultBranch ?? "main");
    setHead("");
    setTitle("");
    setTitleEdited(false);
  }, [repo]);

  const reset = () => {
    seeded.current = undefined;
    setRepoName("");
    setBase("");
    setHead("");
    setTitle("");
    setBody("");
    setTitleEdited(false);
    setDraft(true);
  };

  const changeOpen = (next: boolean) => {
    if (creating) return;
    onOpenChange(next);
    if (!next) reset();
  };

  const invalid =
    repo === undefined ||
    base.trim() === "" ||
    head.trim() === "" ||
    base.trim() === head.trim() ||
    title.trim() === "";

  const create = () => {
    if (invalid || repo === undefined) return;
    setCreating(true);
    onCreate({
      repo,
      baseBranch: base.trim(),
      headBranch: head.trim(),
      title: title.trim(),
      body: body.trim(),
      draft,
    })
      .then(() => {
        onOpenChange(false);
        reset();
      })
      .catch(() => undefined)
      .finally(() => setCreating(false));
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New pull request</DialogTitle>
          <DialogDescription>
            Open a pull request from a repository branch
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {AsyncResult.isFailure(reposResult) ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground-2">
              No repositories
            </div>
          ) : (
            <>
              <FieldGroup label="Repository">
                <RepositoryPicker
                  repos={repos}
                  value={repo}
                  onChange={setRepoName}
                />
              </FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldGroup label="Base branch">
                  <BranchPicker
                    orgId={orgId}
                    repo={repo}
                    value={base}
                    label="Base branch"
                    onChange={setBase}
                  />
                </FieldGroup>
                <FieldGroup label="Head branch">
                  <BranchPicker
                    orgId={orgId}
                    repo={repo}
                    value={head}
                    label="Head branch"
                    onChange={(branch) => {
                      setHead(branch);
                      if (!titleEdited) setTitle(branch);
                    }}
                  />
                </FieldGroup>
              </div>
              <FieldGroup label="Title">
                <Input
                  aria-label="Title"
                  value={title}
                  placeholder="Pull request title"
                  onChange={(event) => {
                    setTitleEdited(true);
                    setTitle(event.target.value);
                  }}
                />
              </FieldGroup>
              <FieldGroup label="Description">
                <Textarea
                  aria-label="Description"
                  placeholder="Describe the changes"
                  className="min-h-20"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </FieldGroup>
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  aria-label="Create as draft"
                  checked={draft}
                  onCheckedChange={(checked) => setDraft(checked === true)}
                />
                Create as draft
              </span>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            disabled={creating}
            onClick={() => changeOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={invalid || creating} onClick={create}>
            {creating ? "Creating" : "Create pull request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
