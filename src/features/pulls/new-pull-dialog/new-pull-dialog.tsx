import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { cx, menuCheckClassName, menuIconSlotClassName } from "@/components/view-toolbar";
import {
  BranchGlyph,
  CheckGlyph,
  ChevronDownGlyph,
  PullRequestGlyph,
} from "@/features/pulls/pulls-list/pull-row/pull-icons";
import {
  decodeBranches,
  decodeInstallationRepos,
  type InstallationRepo,
} from "@/features/pulls/pulls-page/data/pull";
import {
  installationReposAtom,
  pullBranchesAtom,
} from "@/features/pulls/pulls-page/data/atoms";
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

const searchInputClassName =
  "h-7 w-full min-w-0 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground-3";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground-1">{label}</span>
      {children}
    </label>
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
    <Menu onOpenChange={(open) => (open ? undefined : setQuery(""))}>
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
        {value === undefined ? null : <PullRequestGlyph className="size-(--icon-sm)" />}
        <span className="min-w-0 truncate">
          {value === undefined ? "Select repository" : value.fullName}
        </span>
        <ChevronDownGlyph className="ml-auto size-(--icon-xs)" />
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        <MenuSearchRow>
          <input
            className={searchInputClassName}
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
            <MenuItem key={repo.fullName} onClick={() => onChange(repo.fullName)}>
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
        <ChevronDownGlyph className="ml-auto size-(--icon-xs)" />
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        {repo === undefined ? null : (
          <BranchItems orgId={orgId} repo={repo} value={value} onChange={onChange} />
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
  const repo = repos.find((candidate) => candidate.fullName === repoName) ?? repos[0];
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

  const failed = AsyncResult.isFailure(reposResult);

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
          {failed ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground-2">
              No repositories
            </div>
          ) : (
            <>
              <Field label="Repository">
                <RepositoryPicker repos={repos} value={repo} onChange={setRepoName} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Base branch">
                  <BranchPicker
                    orgId={orgId}
                    repo={repo}
                    value={base}
                    label="Base branch"
                    onChange={setBase}
                  />
                </Field>
                <Field label="Head branch">
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
                </Field>
              </div>
              <Field label="Title">
                <Input
                  value={title}
                  placeholder="Pull request title"
                  onChange={(event) => {
                    setTitleEdited(true);
                    setTitle(event.target.value);
                  }}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  aria-label="Description"
                  placeholder="Describe the changes"
                  className="min-h-20"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </Field>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: the checkbox is the child */}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={draft}
                  onCheckedChange={(checked) => setDraft(checked === true)}
                />
                Create as draft
              </label>
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
