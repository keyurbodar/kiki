import { useAtomSet } from "@effect/atom-react";
import { type KeyboardEvent, type ReactNode, useEffect, useState } from "react";
import {
  SettingsLoadFailedRow,
  SettingsLoadingCard,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  createFilterRuleAtom,
  createIgnorePathsAtom,
  deleteFilterRuleAtom,
  deleteIgnorePathsAtom,
  reviewFilterRulesAtom,
  reviewIgnorePathsAtom,
  reviewReactivityKeys,
  reviewSettingsAtom,
  updateFilterRuleAtom,
  updateIgnorePathsAtom,
} from "@/data/atoms/reviews";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
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
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { toast } from "@/primitives/toaster";
import {
  CheckIcon,
  ChevronDownIcon,
  DotsIcon,
  PencilIcon,
  PlusIcon,
  PlusLargeIcon,
  TrashIcon,
} from "../review-page/review-icons";
import { errorMessage, type ReviewSetting } from "../review-page/review-model";
import {
  checkClass,
  cx,
  RepoAvatar,
  useQuery,
  useReviewOrg,
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
  blankCondition,
  type ConditionField,
  conditionFields,
  conditionsValid,
  type DraftCondition,
  describeRule,
  draftConditions,
  type FilterRepository,
  type FilterRule,
  type FilterRulesList,
  fieldLabels,
  fieldPlaceholders,
  filterLimits,
  type IgnorePathsRow,
  operatorLabel,
  patternsValid,
  repositoryName,
  rulePayload,
  sourceLabel,
  splitValues,
} from "./filters-model";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
const rulesColumns = [
  "minmax(0,2.4fr)",
  `minmax(${spacing(42.5)},1fr)`,
  `minmax(${spacing(30)},0.8fr)`,
  "auto",
];
const pathsColumns = [
  `minmax(${spacing(35)},1fr)`,
  "minmax(0,2.4fr)",
  `minmax(${spacing(52.5)},1.2fr)`,
  "auto",
];
const stackTable = "max-sm:flex max-sm:flex-col";
const stackRow =
  "group/row max-sm:flex max-sm:flex-col max-sm:gap-1 max-sm:py-3";
const stackCell = "max-sm:min-h-0";
const revealOnHover =
  "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 pointer-coarse:opacity-100";

const keepMenuKeys = (event: KeyboardEvent) => {
  if (!["Escape", "ArrowDown", "ArrowUp"].includes(event.key))
    event.stopPropagation();
};

/** PR filters and Ignore paths, the two filter cards on Agent config. */
export function ReviewFiltersSections({ orgId }: { orgId: OrgId }) {
  const rulesQuery = useQuery(reviewFilterRulesAtom(orgId));
  const pathsQuery = useQuery(reviewIgnorePathsAtom(orgId));
  const list = rulesQuery.value as FilterRulesList | undefined;
  const ignorePaths = (
    pathsQuery.value as
      | { ignorePaths: ReadonlyArray<IgnorePathsRow> }
      | undefined
  )?.ignorePaths;
  const settings = useQuery(reviewSettingsAtom(orgId)).value as
    | ReadonlyArray<ReviewSetting>
    | undefined;
  const repos = settings?.map((row) => row.repo) ?? [];
  const createRule = useAtomSet(createFilterRuleAtom, { mode: "promise" });
  const updateRule = useAtomSet(updateFilterRuleAtom, { mode: "promise" });
  const deleteRule = useAtomSet(deleteFilterRuleAtom, { mode: "promise" });
  const createPaths = useAtomSet(createIgnorePathsAtom, { mode: "promise" });
  const updatePaths = useAtomSet(updateIgnorePathsAtom, { mode: "promise" });
  const deletePaths = useAtomSet(deleteIgnorePathsAtom, { mode: "promise" });
  const { isAdmin } = useReviewOrg();
  const [addingRule, setAddingRule] = useState(false);
  const [addingPaths, setAddingPaths] = useState(false);
  const [busy, setBusy] = useState(false);
  const ruleKeys = [reviewReactivityKeys.filterRules(orgId)];
  const pathKeys = [reviewReactivityKeys.ignorePaths(orgId)];

  const run = (write: Promise<unknown>, failure: string) => {
    setBusy(true);
    return write
      .then(() => true)
      .catch((error: unknown) => {
        toast.error(errorMessage(error, failure));
        return false;
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <SettingsSection
        id="review-filter-rules"
        title="PR filters"
        description="Pull requests that match a rule are not reviewed"
      >
        {rulesQuery.failed ? (
          <Card>
            <SettingsLoadFailedRow
              label="Could not load rules"
              onRetry={rulesQuery.refresh}
            />
          </Card>
        ) : (
          <FilterRulesCard
            rules={list?.rules}
            repos={repos}
            repositories={list?.repositories ?? []}
            repositoryConditionsEnabled={
              list?.repositoryConditionsEnabled ?? false
            }
            adding={addingRule}
            busy={busy}
            isAdmin={isAdmin}
            onAdd={() => setAddingRule(true)}
            onCancelAdd={() => setAddingRule(false)}
            onCreate={(payload) => {
              void run(
                createRule({
                  params: { orgId },
                  payload,
                  reactivityKeys: ruleKeys,
                }),
                "Could not add the rule",
              ).then((ok) => ok && setAddingRule(false));
            }}
            onUpdate={(id, payload) =>
              run(
                updateRule({
                  params: { orgId, id },
                  payload,
                  reactivityKeys: ruleKeys,
                }),
                "Could not save the rule",
              )
            }
            onDelete={(id) => {
              void run(
                deleteRule({ params: { orgId, id }, reactivityKeys: ruleKeys }),
                "Could not delete the rule",
              );
            }}
          />
        )}
      </SettingsSection>
      <SettingsSection
        id="review-ignore-paths"
        title="Ignore paths"
        description="Files matching these patterns are not reviewed; a pull request that only touches them is skipped"
      >
        {pathsQuery.failed ? (
          <Card>
            <SettingsLoadFailedRow
              label="Could not load ignore paths"
              onRetry={pathsQuery.refresh}
            />
          </Card>
        ) : (
          <IgnorePathsCard
            rows={ignorePaths}
            repos={repos}
            adding={addingPaths}
            busy={busy}
            isAdmin={isAdmin}
            onAdd={() => setAddingPaths(true)}
            onCancelAdd={() => setAddingPaths(false)}
            onCreate={(payload) => {
              void run(
                createPaths({
                  params: { orgId },
                  payload,
                  reactivityKeys: pathKeys,
                }),
                "Could not add the ignore paths",
              ).then((ok) => ok && setAddingPaths(false));
            }}
            onUpdate={(id, payload) =>
              run(
                updatePaths({
                  params: { orgId, id },
                  payload,
                  reactivityKeys: pathKeys,
                }),
                "Could not save the ignore paths",
              )
            }
            onDelete={(id) => {
              void run(
                deletePaths({
                  params: { orgId, id },
                  reactivityKeys: pathKeys,
                }),
                "Could not delete the ignore paths",
              );
            }}
          />
        )}
      </SettingsSection>
    </>
  );
}

function ScopeCell({ repo }: { repo: string | null }) {
  return repo === null ? (
    <span className="text-sm text-muted-foreground-1">All repositories</span>
  ) : (
    <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
      <RepoAvatar repo={repo} />
      <span className="truncate">{repo}</span>
    </span>
  );
}

function RowActions({
  label,
  editLabel,
  deleteLabel,
  disabled,
  onEdit,
  onDelete,
  className,
}: {
  label: string;
  editLabel: string;
  deleteLabel: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            className={cx(revealOnHover, className)}
            onClick={(event) => event.stopPropagation()}
          >
            <DotsIcon />
          </Button>
        }
      />
      <MenuContent align="end" className="w-44">
        <MenuItem onClick={onEdit}>
          <span className={menuIconSlot}>
            <PencilIcon />
          </span>
          {editLabel}
        </MenuItem>
        <MenuItem intent="danger" onClick={onDelete}>
          <span className={menuIconSlot}>
            <TrashIcon />
          </span>
          {deleteLabel}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function AddAction({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      disabled={disabled}
      title={label}
      className="-my-1"
      onClick={onClick}
    >
      <PlusIcon />
    </Button>
  );
}

function EmptyRow({ title }: { title: string }) {
  return (
    <ReviewTableRow interactive={false} className="max-sm:flex">
      <ReviewTableCell className="col-span-full text-sm max-sm:w-full">
        {title}
      </ReviewTableCell>
    </ReviewTableRow>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="text-sm text-muted-foreground-2 sm:w-12 sm:shrink-0 sm:pt-1.5">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function EditorFooter({
  busy,
  valid,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  valid: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogFooter>
      <Button variant="ghost" disabled={busy} onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="solid" disabled={busy || !valid} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}

function ScopeSelect({
  value,
  repos,
  disabled,
  onChange,
}: {
  value: string | null;
  repos: ReadonlyArray<string>;
  disabled: boolean;
  onChange: (repo: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = repos.filter((repo) =>
    repo.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Menu onOpenChange={(open) => !open && setSearch("")}>
      <MenuTrigger
        render={
          <Button
            variant="solid"
            size="sm"
            className="w-full min-w-0 justify-between sm:w-56"
            aria-label="Scope"
            disabled={disabled}
          >
            <span className="flex min-w-0 items-center gap-2">
              {value !== null && <RepoAvatar repo={value} />}
              <span className="truncate">{value ?? "All repositories"}</span>
            </span>
            <ChevronDownIcon />
          </Button>
        }
      />
      <MenuContent className="w-80 max-w-full">
        <MenuSearchRow>
          <input
            aria-label="Search repositories"
            placeholder="Search repositories"
            value={search}
            className={menuSearchInput}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={keepMenuKeys}
          />
        </MenuSearchRow>
        {search === "" && (
          <MenuItem onClick={() => onChange(null)}>
            <span className={menuIconSlot} />
            All repositories
            {value === null && <CheckIcon className={checkClass} />}
          </MenuItem>
        )}
        {matches.map((repo) => (
          <MenuItem key={repo} onClick={() => onChange(repo)}>
            <span className={menuIconSlot}>
              <RepoAvatar repo={repo} />
            </span>
            <span className="truncate">{repo}</span>
            {value === repo && <CheckIcon className={checkClass} />}
          </MenuItem>
        ))}
        {matches.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground-2">
            No matching repositories
          </p>
        )}
      </MenuContent>
    </Menu>
  );
}

const repositoryPageSize = 25;

function RepositorySelect({
  values,
  repositories,
  disabled,
  onChange,
}: {
  values: ReadonlyArray<string>;
  repositories: ReadonlyArray<FilterRepository>;
  disabled: boolean;
  onChange: (values: ReadonlyArray<string>) => void;
}) {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const options = [
    ...values
      .filter(
        (value) =>
          !repositories.some((repo) => String(repo.githubRepoId) === value),
      )
      .map((value) => ({
        value,
        label: repositoryName(value, repositories),
        repo: null as string | null,
      })),
    ...repositories.map((repo) => ({
      value: String(repo.githubRepoId),
      label: repo.repo,
      repo: repo.repo as string | null,
    })),
  ].filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );
  const start = Math.min(
    offset,
    Math.max(0, Math.ceil(options.length / repositoryPageSize) - 1) *
      repositoryPageSize,
  );
  const summary = values
    .map((value) => repositoryName(value, repositories))
    .join(", ");
  return (
    <Menu
      onOpenChange={(open) => {
        if (open) return;
        setSearch("");
        setOffset(0);
      }}
    >
      <MenuTrigger
        render={
          <Button
            variant="solid"
            size="sm"
            className="min-w-0 flex-1 justify-between"
            aria-label="Repositories"
            title={summary || "Select repositories"}
            disabled={disabled}
          >
            <span className="truncate">{summary || "Select repositories"}</span>
            <ChevronDownIcon />
          </Button>
        }
      />
      <MenuContent className="w-80 max-w-full">
        <MenuSearchRow>
          <input
            aria-label="Search repositories"
            placeholder="Search repositories"
            value={search}
            className={menuSearchInput}
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
            onKeyDown={keepMenuKeys}
          />
        </MenuSearchRow>
        {options.slice(start, start + repositoryPageSize).map((option) => {
          const chosen = values.includes(option.value);
          return (
            <MenuItem
              key={option.value}
              closeOnClick={false}
              disabled={!chosen && values.length >= filterLimits.values}
              onClick={() =>
                onChange(
                  chosen
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value],
                )
              }
            >
              <span className={menuIconSlot}>
                {option.repo !== null && <RepoAvatar repo={option.repo} />}
              </span>
              <span className="truncate">{option.label}</span>
              {chosen && <CheckIcon className={checkClass} />}
            </MenuItem>
          );
        })}
        {options.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground-2">
            No matching repositories
          </p>
        )}
        {options.length > repositoryPageSize && (
          <div className="flex flex-wrap items-center justify-between gap-1 px-2">
            <span className="text-xs text-muted-foreground-2 tabular-nums">
              {options.length} repositories
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Previous repositories"
              disabled={start === 0}
              onClick={() => setOffset(Math.max(0, start - repositoryPageSize))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Next repositories"
              disabled={start + repositoryPageSize >= options.length}
              onClick={() => setOffset(start + repositoryPageSize)}
            >
              Next
            </Button>
          </div>
        )}
      </MenuContent>
    </Menu>
  );
}

type RulePayload = ReturnType<typeof rulePayload>;

function RuleEditor({
  initial,
  repos,
  repositories,
  repositoryConditionsEnabled,
  busy,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial: Pick<FilterRule, "repo" | "conditions" | "repositoryCondition">;
  repos: ReadonlyArray<string>;
  repositories: ReadonlyArray<FilterRepository>;
  repositoryConditionsEnabled: boolean;
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: RulePayload) => void;
}) {
  const [repo, setRepo] = useState(initial.repo);
  const [drafts, setDrafts] = useState(() => draftConditions(initial));
  const fields = conditionFields.filter(
    (field) => field !== "repository" || repositoryConditionsEnabled,
  );
  const repositoryTaken = drafts.some((draft) => draft.field === "repository");
  const patch = (index: number, change: Partial<DraftCondition>) =>
    setDrafts(
      drafts.map((draft, i) => (i === index ? { ...draft, ...change } : draft)),
    );
  return (
    <>
      <DialogBody className="flex flex-col gap-3">
        <EditorField label="In">
          <ScopeSelect
            value={repo}
            repos={repos}
            disabled={busy}
            onChange={setRepo}
          />
        </EditorField>
        {drafts.map((draft, index) => (
          <EditorField
            // biome-ignore lint/suspicious/noArrayIndexKey: conditions have no ids; Capy keys them by position
            key={index}
            label={index === 0 ? "When" : "and"}
          >
            <div className="flex flex-col gap-2">
              <div className="flex min-w-0 gap-2">
                <MenuSelect
                  items={fields.map((field) => ({
                    label: fieldLabels[field],
                    value: field,
                  }))}
                  value={draft.field}
                  onValueChange={(next) => {
                    if (!next) return;
                    const field = next as ConditionField;
                    patch(index, {
                      field,
                      values:
                        (field === "repository") ===
                        (draft.field === "repository")
                          ? draft.values
                          : "",
                    });
                  }}
                >
                  <MenuSelectTrigger
                    className="w-36 shrink-0"
                    aria-label="Field"
                    disabled={busy}
                  >
                    <MenuSelectValue>
                      {fieldLabels[draft.field]}
                    </MenuSelectValue>
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    {fields.map((field) => (
                      <MenuSelectItem
                        key={field}
                        value={field}
                        disabled={
                          field === "repository" &&
                          draft.field !== "repository" &&
                          repositoryTaken
                        }
                      >
                        {fieldLabels[field]}
                      </MenuSelectItem>
                    ))}
                  </MenuSelectContent>
                </MenuSelect>
                <MenuSelect
                  items={[
                    { label: operatorLabel(draft.field, false), value: "is" },
                    { label: operatorLabel(draft.field, true), value: "not" },
                  ]}
                  value={draft.not ? "not" : "is"}
                  onValueChange={(next) =>
                    next && patch(index, { not: next === "not" })
                  }
                >
                  <MenuSelectTrigger
                    className="min-w-0 flex-1"
                    aria-label="Operator"
                    disabled={
                      busy ||
                      (draft.field === "repository" &&
                        !repositoryConditionsEnabled)
                    }
                  >
                    <MenuSelectValue>
                      <span className="truncate">
                        {operatorLabel(draft.field, draft.not)}
                      </span>
                    </MenuSelectValue>
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    <MenuSelectItem value="is">
                      {operatorLabel(draft.field, false)}
                    </MenuSelectItem>
                    <MenuSelectItem value="not">
                      {operatorLabel(draft.field, true)}
                    </MenuSelectItem>
                  </MenuSelectContent>
                </MenuSelect>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {draft.field === "repository" ? (
                  <RepositorySelect
                    values={splitValues(draft.values)}
                    repositories={repositories}
                    disabled={busy || !repositoryConditionsEnabled}
                    onChange={(values) =>
                      patch(index, { values: values.join(", ") })
                    }
                  />
                ) : (
                  <Input
                    size="sm"
                    className="min-w-0 flex-1"
                    value={draft.values}
                    placeholder={fieldPlaceholders[draft.field]}
                    aria-label="Values, comma-separated"
                    disabled={busy}
                    onChange={(event) =>
                      patch(index, { values: event.target.value })
                    }
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove condition"
                  disabled={busy || drafts.length === 1}
                  onClick={() =>
                    setDrafts(drafts.filter((_, i) => i !== index))
                  }
                >
                  <TrashIcon />
                </Button>
              </div>
            </div>
          </EditorField>
        ))}
        <div className="sm:pl-15">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || drafts.length >= filterLimits.conditions}
            onClick={() => setDrafts([...drafts, blankCondition()])}
          >
            <PlusLargeIcon />
            Add condition
          </Button>
        </div>
      </DialogBody>
      <EditorFooter
        busy={busy}
        valid={conditionsValid(drafts, repositories)}
        submitLabel={submitLabel}
        onCancel={onCancel}
        onSubmit={() =>
          onSubmit(rulePayload(repo, drafts, repositoryConditionsEnabled))
        }
      />
    </>
  );
}

/** Drop the editor when the viewer loses admin rights mid-edit. */
function useCloseWhenNotAdmin(
  isAdmin: boolean,
  adding: boolean,
  onCancelAdd: () => void,
  setEditing: (id: string | null) => void,
) {
  useEffect(() => {
    if (isAdmin) return;
    if (adding) onCancelAdd();
    setEditing(null);
  }, [isAdmin, adding, onCancelAdd, setEditing]);
}

function FilterRulesCard({
  rules,
  repos,
  repositories,
  repositoryConditionsEnabled,
  adding,
  busy,
  isAdmin,
  onAdd,
  onCancelAdd,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rules?: ReadonlyArray<FilterRule>;
  repos: ReadonlyArray<string>;
  repositories: ReadonlyArray<FilterRepository>;
  repositoryConditionsEnabled: boolean;
  adding: boolean;
  busy: boolean;
  isAdmin: boolean;
  onAdd: () => void;
  onCancelAdd: () => void;
  onCreate: (payload: RulePayload) => void;
  onUpdate: (id: string, payload: RulePayload) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  useCloseWhenNotAdmin(isAdmin, adding, onCancelAdd, setEditingId);
  if (rules === undefined) return <SettingsLoadingCard />;
  const editing = rules.find((rule) => rule.id === editingId);
  const open = isAdmin && (adding || editing !== undefined);
  const actions = (rule: FilterRule, className?: string) =>
    isAdmin ? (
      <RowActions
        label="Rule actions"
        editLabel="Edit rule"
        deleteLabel="Delete rule"
        disabled={busy}
        onEdit={() => setEditingId(rule.id)}
        onDelete={() => onDelete(rule.id)}
        className={className}
      />
    ) : null;
  return (
    <>
      <ReviewTable
        card
        cardClassName="overflow-x-clip"
        columns={rulesColumns}
        density="pick"
        className={stackTable}
      >
        <ReviewTableHeader className="max-sm:flex max-sm:justify-end">
          <ReviewTableHead className="max-sm:hidden">Rule</ReviewTableHead>
          <ReviewTableHead className="max-sm:hidden">Scope</ReviewTableHead>
          <ReviewTableHead className="max-sm:hidden">Source</ReviewTableHead>
          <ReviewTableHead className="justify-end pr-0">
            {isAdmin ? (
              <AddAction
                label="Add rule"
                disabled={adding || rules.length >= filterLimits.rules}
                onClick={onAdd}
              />
            ) : null}
          </ReviewTableHead>
        </ReviewTableHeader>
        {rules.length === 0 ? (
          <EmptyRow title="No rules" />
        ) : (
          rules.map((rule) => (
            <ReviewTableRow
              key={rule.id}
              className={cx(stackRow, isAdmin && "cursor-pointer")}
              interactive={isAdmin}
              onClick={isAdmin ? () => setEditingId(rule.id) : undefined}
            >
              <ReviewTableCell
                className={cx(
                  stackCell,
                  "gap-2 py-2 text-sm text-foreground max-sm:justify-between",
                )}
              >
                <span className="flex min-w-0 flex-col gap-1 break-words">
                  <span>{describeRule(rule, repositories)}</span>
                  {rule.skipped && (
                    <span className="text-xs text-muted-foreground-2">
                      Not applied
                    </span>
                  )}
                </span>
                {actions(rule, "sm:hidden")}
              </ReviewTableCell>
              <ReviewTableCell className={stackCell}>
                <ScopeCell repo={rule.repo} />
              </ReviewTableCell>
              <ReviewTableCell className={cx(stackCell, "text-sm")}>
                {sourceLabel(rule)}
              </ReviewTableCell>
              <ReviewTableCell
                className={cx(stackCell, "justify-end pr-0 max-sm:hidden")}
              >
                {actions(rule)}
              </ReviewTableCell>
            </ReviewTableRow>
          ))
        )}
      </ReviewTable>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next || !isAdmin) return;
          if (adding) onCancelAdd();
          setEditingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adding ? "Add rule" : "Edit rule"}</DialogTitle>
          </DialogHeader>
          {adding ? (
            <RuleEditor
              initial={{
                repo: null,
                conditions: [],
                repositoryCondition: null,
              }}
              repos={repos}
              repositories={repositories}
              repositoryConditionsEnabled={repositoryConditionsEnabled}
              busy={busy}
              submitLabel="Add rule"
              onCancel={onCancelAdd}
              onSubmit={onCreate}
            />
          ) : editing === undefined ? null : (
            <RuleEditor
              key={editing.id}
              initial={editing}
              repos={repos}
              repositories={repositories}
              repositoryConditionsEnabled={repositoryConditionsEnabled}
              busy={busy}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={(payload) => {
                void onUpdate(editing.id, payload).then(
                  (ok) => ok && setEditingId(null),
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type PathsPayload = { repo: string | null; patterns: ReadonlyArray<string> };

function PathsEditor({
  initial,
  repos,
  busy,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial: PathsPayload;
  repos: ReadonlyArray<string>;
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: PathsPayload) => void;
}) {
  const [repo, setRepo] = useState(initial.repo);
  const [text, setText] = useState(() => initial.patterns.join(","));
  const patterns = splitValues(text);
  return (
    <>
      <DialogBody className="flex flex-col gap-3">
        <EditorField label="In">
          <ScopeSelect
            value={repo}
            repos={repos}
            disabled={busy}
            onChange={setRepo}
          />
        </EditorField>
        <EditorField label="Ignore">
          <Input
            size="sm"
            value={text}
            placeholder="pnpm-lock.yaml,**/*.generated.*,dist/**"
            aria-label="Ignore patterns, comma-separated"
            disabled={busy}
            onChange={(event) => setText(event.target.value)}
          />
          <span className="text-xs text-muted-foreground-2">
            gitignore patterns, comma-separated
          </span>
        </EditorField>
      </DialogBody>
      <EditorFooter
        busy={busy}
        valid={patternsValid(patterns)}
        submitLabel={submitLabel}
        onCancel={onCancel}
        onSubmit={() => onSubmit({ repo, patterns })}
      />
    </>
  );
}

function IgnorePathsCard({
  rows,
  repos,
  adding,
  busy,
  isAdmin,
  onAdd,
  onCancelAdd,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rows?: ReadonlyArray<IgnorePathsRow>;
  repos: ReadonlyArray<string>;
  adding: boolean;
  busy: boolean;
  isAdmin: boolean;
  onAdd: () => void;
  onCancelAdd: () => void;
  onCreate: (payload: PathsPayload) => void;
  onUpdate: (id: string, payload: PathsPayload) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  useCloseWhenNotAdmin(isAdmin, adding, onCancelAdd, setEditingId);
  if (rows === undefined) return <SettingsLoadingCard />;
  const editing = rows.find((row) => row.id === editingId);
  const open = isAdmin && (adding || editing !== undefined);
  const actions = (row: IgnorePathsRow, className?: string) =>
    isAdmin ? (
      <RowActions
        label="Ignore paths actions"
        editLabel="Edit"
        deleteLabel="Delete"
        disabled={busy}
        onEdit={() => setEditingId(row.id)}
        onDelete={() => onDelete(row.id)}
        className={className}
      />
    ) : null;
  return (
    <>
      <ReviewTable
        card
        cardClassName="overflow-x-clip"
        columns={pathsColumns}
        density="pick"
        className={stackTable}
      >
        <ReviewTableHeader className="max-sm:flex max-sm:justify-end">
          <ReviewTableHead className="max-sm:hidden">Scope</ReviewTableHead>
          <ReviewTableHead className="max-sm:hidden">Patterns</ReviewTableHead>
          <ReviewTableHead className="max-sm:hidden">Source</ReviewTableHead>
          <ReviewTableHead className="justify-end pr-0">
            {isAdmin ? (
              <AddAction
                label="Add ignore paths"
                disabled={adding || rows.length >= filterLimits.ignorePaths}
                onClick={onAdd}
              />
            ) : null}
          </ReviewTableHead>
        </ReviewTableHeader>
        {rows.length === 0 ? (
          <EmptyRow title="No ignore paths" />
        ) : (
          rows.map((row) => (
            <ReviewTableRow
              key={row.id}
              className={cx(stackRow, isAdmin && "cursor-pointer")}
              interactive={isAdmin}
              onClick={isAdmin ? () => setEditingId(row.id) : undefined}
            >
              <ReviewTableCell
                className={cx(stackCell, "max-sm:justify-between")}
              >
                <ScopeCell repo={row.repo} />
                {actions(row, "sm:hidden")}
              </ReviewTableCell>
              <ReviewTableCell
                className={cx(stackCell, "gap-2 py-2 text-sm text-foreground")}
              >
                <span className="min-w-0 break-all">
                  {row.patterns.join(",")}
                </span>
                {row.skipped && (
                  <Badge
                    className="shrink-0"
                    color="warning"
                    title="Pattern exceeds the wildcard limit, edit the row to apply it"
                  >
                    Not applied
                  </Badge>
                )}
              </ReviewTableCell>
              <ReviewTableCell className={cx(stackCell, "text-sm")}>
                {sourceLabel(row)}
              </ReviewTableCell>
              <ReviewTableCell
                className={cx(stackCell, "justify-end pr-0 max-sm:hidden")}
              >
                {actions(row)}
              </ReviewTableCell>
            </ReviewTableRow>
          ))
        )}
      </ReviewTable>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next || !isAdmin) return;
          if (adding) onCancelAdd();
          setEditingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adding ? "Add ignore paths" : "Edit ignore paths"}
            </DialogTitle>
          </DialogHeader>
          {adding ? (
            <PathsEditor
              initial={{ repo: null, patterns: [] }}
              repos={repos}
              busy={busy}
              submitLabel="Add"
              onCancel={onCancelAdd}
              onSubmit={onCreate}
            />
          ) : editing === undefined ? null : (
            <PathsEditor
              key={editing.id}
              initial={editing}
              repos={repos}
              busy={busy}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={(payload) => {
                void onUpdate(editing.id, payload).then(
                  (ok) => ok && setEditingId(null),
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
