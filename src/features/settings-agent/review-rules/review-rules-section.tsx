import { useAtomSet } from "@effect/atom-react";
import {
  type FormEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  createReviewRuleAtom,
  removeReviewRuleAtom,
  reviewReactivityKeys,
  reviewRulesPageAtom,
  reviewRulesPageKey,
  reviewSettingsAtom,
  updateReviewRuleAtom,
} from "@/data/atoms/reviews";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
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
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Switch } from "@/primitives/switch";
import { Textarea } from "@/primitives/textarea";
import {
  CheckIcon,
  ChevronDownIcon,
  CrossIcon,
  DotsIcon,
  EditIcon,
  FileTextIcon,
  NoteTextIcon,
  PlusIcon,
  TrashIcon,
} from "../review-page/review-icons";
import { errorMessage, type ReviewSetting } from "../review-page/review-model";
import {
  checkClass,
  cx,
  RepoAvatar,
  useQuery,
} from "../review-page/review-shared";
import {
  ReviewTable,
  ReviewTableCell,
  ReviewTableHead,
  ReviewTableHeader,
  ReviewTableRow,
  spacing,
} from "../review-page/review-table";
import {
  accessChanged,
  type DraftScope,
  draftScopes,
  filePathValid,
  parseScopes,
  type ReviewRule,
  type ReviewRulesPage,
  type RuleDraft,
  ruleDialogSubtitle,
  ruleLimits,
  rulePatch,
  ruleSource,
  ruleTitle,
  scopeSummary,
  scopesValid,
  scopeTitle,
} from "./rules-model";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
const revealOnHover =
  "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 pointer-coarse:opacity-100";
const rulesColumns = [
  "minmax(0,2.4fr)",
  `minmax(${spacing(42.5)},1fr)`,
  `minmax(${spacing(30)},0.8fr)`,
  "auto",
  "auto",
];

/** Custom instructions: the review rules card with its editor and delete dialogs. */
export function ReviewRulesSection({ orgId }: { orgId: OrgId }) {
  const [cursors, setCursors] = useState<ReadonlyArray<string>>([""]);
  const cursor = cursors.at(-1) ?? "";
  const query = useQuery(
    reviewRulesPageAtom(reviewRulesPageKey(orgId, cursor)),
  );
  const page = query.value as ReviewRulesPage | undefined;
  const settings = useQuery(reviewSettingsAtom(orgId)).value as
    | ReadonlyArray<ReviewSetting>
    | undefined;
  const create = useAtomSet(createReviewRuleAtom, { mode: "promise" });
  const update = useAtomSet(updateReviewRuleAtom, { mode: "promise" });
  const remove = useAtomSet(removeReviewRuleAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ReviewRule | "new" | null>(null);
  const [deleting, setDeleting] = useState<ReviewRule | null>(null);
  const reactivityKeys = [reviewReactivityKeys.rules(orgId)];

  const save = (draft: RuleDraft) => {
    if (editing === null) return;
    const patch = rulePatch(editing === "new" ? undefined : editing, draft);
    if (Object.keys(patch).length === 0) {
      setEditing(null);
      return;
    }
    setBusy(true);
    (editing === "new"
      ? create({ params: { orgId }, payload: patch, reactivityKeys })
      : update({
          params: { orgId, id: editing.id },
          payload: patch,
          reactivityKeys,
        })
    )
      .then(() => {
        setEditing(null);
        setCursors([""]);
      })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not save the instruction")),
      )
      .finally(() => setBusy(false));
  };

  const toggle = (rule: ReviewRule, active: boolean) => {
    setBusy(true);
    update({
      params: { orgId, id: rule.id },
      payload: { status: active ? "active" : "inactive" },
      reactivityKeys,
    })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not update the instruction")),
      )
      .finally(() => setBusy(false));
  };

  const confirmDelete = () => {
    if (deleting === null) return;
    setBusy(true);
    remove({ params: { orgId, id: deleting.id }, reactivityKeys })
      .then(() => {
        setDeleting(null);
        setCursors([""]);
      })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not delete the instruction")),
      )
      .finally(() => setBusy(false));
  };

  const nextCursor = page?.nextCursor;
  return (
    <SettingsSection
      id="review-rules"
      title="Custom instructions"
      description="Rules and files Capy follows on every review"
    >
      {query.failed && (
        <div className="flex items-center justify-between gap-3 pb-3 text-sm text-muted-foreground-2">
          <span>Could not refresh instructions</span>
          <Button type="button" variant="ghost" onClick={query.refresh}>
            Retry
          </Button>
        </div>
      )}
      <ReviewRulesCard
        page={page}
        busy={busy}
        pageNumber={cursors.length}
        onAdd={() => setEditing("new")}
        onEdit={setEditing}
        onDelete={setDeleting}
        onToggle={toggle}
        onPrevious={
          cursors.length > 1
            ? () => setCursors(cursors.slice(0, -1))
            : undefined
        }
        onNext={
          nextCursor ? () => setCursors([...cursors, nextCursor]) : undefined
        }
      />
      {editing !== null && (
        <ReviewRuleDialog
          rule={editing === "new" ? undefined : editing}
          repos={settings?.map((row) => row.repo) ?? []}
          busy={busy}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete instruction?</DialogTitle>
            <DialogDescription>
              This permanently removes the instruction from future reviews
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground-1 [overflow-wrap:anywhere]">
              {deleting?.file === null ? deleting.body : deleting?.file?.path}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button intent="danger" disabled={busy} onClick={confirmDelete}>
              Delete instruction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

function ReviewRulesCard({
  page,
  busy,
  pageNumber,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onPrevious,
  onNext,
}: {
  page?: ReviewRulesPage;
  busy: boolean;
  pageNumber: number;
  onAdd: () => void;
  onEdit: (rule: ReviewRule) => void;
  onDelete: (rule: ReviewRule) => void;
  onToggle: (rule: ReviewRule, active: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const actions = (rule: ReviewRule, className?: string) => (
    <Menu>
      <MenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busy}
            aria-label={`Instruction actions: ${ruleTitle(rule)}`}
            className={cx(revealOnHover, className)}
            onClick={(event) => event.stopPropagation()}
          >
            <DotsIcon />
          </Button>
        }
      />
      <MenuContent align="end" className="w-44">
        <MenuItem onClick={() => onEdit(rule)}>
          <EditIcon className={menuIconSlot} />
          Edit instruction
        </MenuItem>
        <MenuItem intent="danger" onClick={() => onDelete(rule)}>
          <TrashIcon className={menuIconSlot} />
          Delete instruction
        </MenuItem>
      </MenuContent>
    </Menu>
  );
  return (
    <ReviewTable
      card
      cardClassName="overflow-x-clip"
      columns={rulesColumns}
      density="pick"
      className="max-sm:flex max-sm:flex-col"
    >
      <ReviewTableHeader className="max-sm:flex max-sm:justify-end">
        <ReviewTableHead className="max-sm:hidden">Instruction</ReviewTableHead>
        <ReviewTableHead className="max-sm:hidden">Scope</ReviewTableHead>
        <ReviewTableHead className="max-sm:hidden">Source</ReviewTableHead>
        <ReviewTableHead className="justify-end max-sm:hidden">
          On
        </ReviewTableHead>
        <ReviewTableHead className="justify-end pr-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Add instruction"
            title="Add instruction"
            disabled={busy}
            className="-my-1"
            onClick={onAdd}
          >
            <PlusIcon />
          </Button>
        </ReviewTableHead>
      </ReviewTableHeader>
      {page === undefined ? (
        <ReviewTableRow interactive={false} className="max-sm:flex">
          <ReviewTableCell className="col-span-full gap-3 max-sm:w-full">
            <SkeletonPanel className="h-4 w-1/3" />
            <SkeletonPanel className="h-4 w-1/4" />
          </ReviewTableCell>
        </ReviewTableRow>
      ) : page.rules.length === 0 ? (
        <ReviewTableRow interactive={false} className="max-sm:flex">
          <ReviewTableCell className="col-span-full text-sm max-sm:w-full">
            No instructions
          </ReviewTableCell>
        </ReviewTableRow>
      ) : (
        page.rules.map((rule) => (
          <ReviewTableRow
            key={rule.id}
            className="group/row cursor-pointer max-sm:flex max-sm:flex-col max-sm:gap-1 max-sm:py-3"
            onClick={busy ? undefined : () => onEdit(rule)}
          >
            <ReviewTableCell className="py-2 text-sm text-foreground max-sm:min-h-0 max-sm:justify-between">
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-muted-foreground-2 [&_svg]:size-(--icon-sm)">
                  {rule.file === null ? <NoteTextIcon /> : <FileTextIcon />}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {ruleTitle(rule)}
                </span>
              </span>
              {actions(rule, "sm:hidden")}
            </ReviewTableCell>
            <ReviewTableCell className="max-sm:min-h-0">
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground-1">
                <span className="truncate" title={scopeTitle(rule)}>
                  {scopeSummary(rule)}
                </span>
                {accessChanged(rule) && (
                  <Badge
                    size="xs"
                    color="warning"
                    title="Repository access changed"
                  >
                    Access changed
                  </Badge>
                )}
              </span>
            </ReviewTableCell>
            <ReviewTableCell className="text-sm max-sm:min-h-0">
              {ruleSource(rule)}
            </ReviewTableCell>
            <ReviewTableCell className="justify-end max-sm:min-h-0 max-sm:justify-start">
              <Switch
                checked={rule.status === "active"}
                disabled={busy}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={(active) => onToggle(rule, active)}
                aria-label={`Enable instruction: ${ruleTitle(rule)}`}
              />
            </ReviewTableCell>
            <ReviewTableCell className="justify-end pr-0 max-sm:hidden">
              {actions(rule)}
            </ReviewTableCell>
          </ReviewTableRow>
        ))
      )}
      {(onPrevious !== undefined || onNext !== undefined) && (
        <ReviewTableRow interactive={false} className="max-sm:flex">
          <ReviewTableCell className="col-span-full justify-between gap-2 max-sm:w-full">
            <span className="text-xs text-muted-foreground-2">
              Page {pageNumber}
            </span>
            <span className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={onPrevious === undefined || busy}
                onClick={onPrevious}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={onNext === undefined || busy}
                onClick={onNext}
              >
                Next
              </Button>
            </span>
          </ReviewTableCell>
        </ReviewTableRow>
      )}
    </ReviewTable>
  );
}

const repoPageSize = 10;

function RepositoryMenu({
  repos,
  allowAll = false,
  chosen,
  onPick,
  trigger,
  children,
}: {
  repos: ReadonlyArray<string>;
  allowAll?: boolean;
  chosen: (repo: string | null) => boolean;
  onPick: (repo: string | null) => void;
  trigger: ReactElement;
  children?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const matches = repos.filter((repo) =>
    repo.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Menu
      onOpenChange={(open) => {
        if (open) return;
        setSearch("");
        setPage(0);
      }}
    >
      <MenuTrigger render={trigger}>{children}</MenuTrigger>
      <MenuContent align="end" className="w-80 max-w-full">
        <MenuSearchRow>
          <input
            aria-label="Search repositories"
            placeholder="Search repositories"
            value={search}
            className={menuSearchInput}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            onKeyDown={(event) => {
              if (!["Escape", "ArrowDown", "ArrowUp"].includes(event.key))
                event.stopPropagation();
            }}
          />
        </MenuSearchRow>
        {allowAll && (
          <MenuItem onClick={() => onPick(null)}>
            All repositories
            {chosen(null) && <CheckIcon className={checkClass} />}
          </MenuItem>
        )}
        {matches
          .slice(page * repoPageSize, (page + 1) * repoPageSize)
          .map((repo) => (
            <MenuItem key={repo} onClick={() => onPick(repo)}>
              <span className="truncate">{repo}</span>
              {chosen(repo) && <CheckIcon className={checkClass} />}
            </MenuItem>
          ))}
        {matches.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground-2">
            No matching repositories
          </p>
        )}
        {matches.length > repoPageSize && (
          <div className="flex justify-between gap-2 px-1 py-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous repositories
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={(page + 1) * repoPageSize >= matches.length}
              onClick={() => setPage(page + 1)}
            >
              More repositories
            </Button>
          </div>
        )}
      </MenuContent>
    </Menu>
  );
}

function ReviewRuleDialog({
  rule,
  repos,
  busy,
  onSave,
  onClose,
}: {
  rule?: ReviewRule;
  repos: ReadonlyArray<string>;
  busy: boolean;
  onSave: (draft: RuleDraft) => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState(rule?.body ?? "");
  const [isFile, setIsFile] = useState(rule?.file != null);
  const [fileRepo, setFileRepo] = useState(rule?.file?.repo ?? "");
  const [filePath, setFilePath] = useState(rule?.file?.path ?? "");
  const [scopes, setScopes] = useState<DraftScope[]>(() =>
    draftScopes(rule?.scopes),
  );
  const [active, setActive] = useState(rule?.status !== "inactive");
  const path = filePath.trim();
  const fileValid = filePathValid(fileRepo, path);
  const parsedScopes = parseScopes(scopes);
  const scopesOk = scopesValid(parsedScopes);
  const valid =
    (isFile ? fileValid : body.trim().length > 0) &&
    body.trim().length <= ruleLimits.body &&
    scopesOk;
  const reachable = (repo: string) =>
    repos.some((candidate) => candidate.toLowerCase() === repo.toLowerCase());
  const manualOnly = (repo: string) =>
    rule?.scopes.some(
      (scope) =>
        scope.repo?.toLowerCase() === repo.toLowerCase() &&
        scope.covered === true &&
        scope.heldByCaller === false,
    ) ?? false;
  const scoped = (repo: string | null) =>
    scopes.some((scope) =>
      repo === null
        ? scope.repo === null
        : scope.repo?.toLowerCase() === repo.toLowerCase(),
    );
  const title = rule === undefined ? "Add instruction" : "Edit instruction";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || busy) return;
    onSave({
      body: body.trim(),
      file: isFile ? { repo: fileRepo, path } : null,
      scopes: parsedScopes,
      status: active ? "active" : "inactive",
    });
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent aria-label={title}>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{ruleDialogSubtitle(rule)}</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            {/* biome-ignore lint/a11y/useSemanticElements: Capy's ButtonGroup is a div with role group */}
            <div
              role="group"
              data-slot="button-group"
              aria-label="Instruction type"
              className="flex self-start"
            >
              <Button
                type="button"
                variant="segmented"
                size="sm"
                data-selected={!isFile || undefined}
                aria-pressed={!isFile}
                disabled={busy}
                onClick={() => setIsFile(false)}
              >
                Rule
              </Button>
              <Button
                type="button"
                variant="segmented"
                size="sm"
                data-selected={isFile || undefined}
                aria-pressed={isFile}
                disabled={busy}
                onClick={() => setIsFile(true)}
              >
                File
              </Button>
            </div>
            {isFile && (
              <div className="flex flex-col gap-1.5">
                <Label>Source file</Label>
                <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <RepositoryMenu
                    repos={repos}
                    chosen={(repo) =>
                      repo !== null &&
                      repo.toLowerCase() === fileRepo.toLowerCase()
                    }
                    onPick={(repo) => setFileRepo(repo ?? "")}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="base"
                        className="w-full min-w-0 justify-between"
                        aria-label="Source repository"
                        disabled={busy}
                      >
                        <span className="truncate">
                          {fileRepo || "Choose repository"}
                        </span>
                        <ChevronDownIcon />
                      </Button>
                    }
                  />
                  <Input
                    size="base"
                    aria-label="Source file"
                    value={filePath}
                    onChange={(event) => setFilePath(event.target.value)}
                    maxLength={ruleLimits.filePath}
                    disabled={busy}
                    required
                    autoFocus
                    placeholder="docs/review-guide.md"
                  />
                </div>
                <span className="text-xs text-muted-foreground-2">
                  {fileRepo !== "" && !reachable(fileRepo)
                    ? "This repository is no longer reachable by the organization"
                    : path !== "" && !fileValid && fileRepo !== ""
                      ? "Use an exact relative path without wildcards or parent folders"
                      : `Text file from the default branch, up to ${ruleLimits.fileBytes / 1000} KB`}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-6 items-center justify-between">
                <Label>
                  {isFile ? "Instruction (optional)" : "Instruction"}
                </Label>
                <span className="text-xs text-muted-foreground-3 tabular-nums">
                  {body.length.toLocaleString()} /{" "}
                  {ruleLimits.body.toLocaleString()}
                </span>
              </div>
              <Textarea
                aria-label={isFile ? "File description" : "Rule"}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={ruleLimits.body}
                rows={isFile ? 3 : 6}
                required={!isFile}
                autoFocus={!isFile}
                disabled={busy}
                className={
                  isFile
                    ? "field-sizing-content min-h-20 max-h-80"
                    : "field-sizing-content min-h-40 max-h-80"
                }
                placeholder={
                  isFile
                    ? "How should Review use this file?"
                    : "Describe what Review should check, including examples or exceptions"
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Applies to</Label>
              <ReviewTable
                card
                cardClassName="overflow-visible"
                density="pick"
                columns={["minmax(0,1.2fr)", "minmax(0,1fr)", "auto"]}
              >
                <ReviewTableHeader>
                  <ReviewTableHead>Repository</ReviewTableHead>
                  <ReviewTableHead>Paths</ReviewTableHead>
                  <ReviewTableHead className="justify-end pr-0">
                    <RepositoryMenu
                      repos={repos}
                      allowAll
                      chosen={scoped}
                      onPick={(repo) => {
                        if (!scoped(repo))
                          setScopes([...scopes, { repo, paths: "" }]);
                      }}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Add repository"
                          className="-my-1"
                          disabled={busy || scopes.length >= ruleLimits.scopes}
                        />
                      }
                    >
                      <PlusIcon />
                    </RepositoryMenu>
                  </ReviewTableHead>
                </ReviewTableHeader>
                {scopes.length === 0 ? (
                  <ReviewTableRow interactive={false}>
                    <ReviewTableCell className="col-span-full text-sm">
                      Add a repository, or All repositories, for this
                      instruction to apply
                    </ReviewTableCell>
                  </ReviewTableRow>
                ) : (
                  scopes.map((scope, index) => (
                    <ReviewTableRow
                      key={scope.repo ?? "*"}
                      className="group/row"
                      interactive={false}
                    >
                      <ReviewTableCell>
                        {scope.repo === null ? (
                          <span className="text-sm text-muted-foreground-1">
                            All repositories
                          </span>
                        ) : (
                          <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                            <RepoAvatar repo={scope.repo} />
                            <span className="truncate" title={scope.repo}>
                              {scope.repo}
                            </span>
                            {!reachable(scope.repo) && (
                              <Badge
                                size="xs"
                                color="warning"
                                title="Repository access changed"
                              >
                                Access changed
                              </Badge>
                            )}
                            {manualOnly(scope.repo) && (
                              <Badge
                                size="xs"
                                color="neutral"
                                className="shrink-0 whitespace-nowrap"
                                title="Only manual reviews paid by this organization"
                              >
                                Manual only
                              </Badge>
                            )}
                          </span>
                        )}
                      </ReviewTableCell>
                      <ReviewTableCell className="py-1">
                        <Input
                          variant="blank"
                          size="sm"
                          value={scope.paths}
                          disabled={busy}
                          placeholder="All files"
                          spellCheck={false}
                          autoCapitalize="off"
                          autoCorrect="off"
                          aria-label={`Paths in ${scope.repo ?? "all repositories"}`}
                          className="-ml-2 w-full"
                          onChange={(event) =>
                            setScopes(
                              scopes.map((current, i) =>
                                i === index
                                  ? { ...current, paths: event.target.value }
                                  : current,
                              ),
                            )
                          }
                        />
                      </ReviewTableCell>
                      <ReviewTableCell className="justify-end pr-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={busy}
                          aria-label={`Remove ${scope.repo ?? "all repositories"}`}
                          className={revealOnHover}
                          onClick={() =>
                            setScopes(scopes.filter((_, i) => i !== index))
                          }
                        >
                          <CrossIcon />
                        </Button>
                      </ReviewTableCell>
                    </ReviewTableRow>
                  ))
                )}
              </ReviewTable>
              <span className="text-xs text-muted-foreground-2">
                {scopesOk || scopes.length === 0
                  ? "Paths are gitignore patterns, comma-separated; empty means every file"
                  : `Up to ${ruleLimits.paths} relative path patterns per repository, at most ${ruleLimits.glob} characters each, without exclusions or parent folders`}
              </span>
            </div>
          </DialogBody>
          <DialogFooter className="justify-between">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: the Switch inside is the control */}
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch
                aria-label="Active instruction"
                checked={active}
                onCheckedChange={setActive}
                disabled={busy}
              />
              Active
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="base"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                intent="accent"
                size="base"
                disabled={busy || !valid}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
