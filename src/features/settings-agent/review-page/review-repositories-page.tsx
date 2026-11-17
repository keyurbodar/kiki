import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import {
  reviewReactivityKeys,
  selfAuthorPolicyAtom,
  setSelfAuthorPolicyAtom,
} from "@/data/atoms/reviews";
import { Button, ButtonIcon } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "./review-icons";
import {
  type AutoReviewMode,
  autoReviewLabel,
  errorMessage,
  heldElsewhere,
  isAddableSetting,
  isEnabledSetting,
  matchesRepo,
  type ReviewSetting,
  repoSearchThreshold,
  type SelfAuthorPolicy,
  settingsSubtitle,
} from "./review-model";
import {
  AutoReviewModeMenu,
  checkClass,
  MenuRowLabel,
  RepoName,
  ReviewAdminNotice,
  ReviewEmptyState,
  useQuery,
  useReviewOrg,
} from "./review-shared";
import {
  ReviewTable,
  ReviewTableCell,
  ReviewTableHead,
  ReviewTableHeader,
  ReviewTableRow,
  spacing,
} from "./review-table";
import { useReviewRepositories } from "./use-review-repositories";

const heldElsewhereReason =
  "Another organization holds this repository's review billing";

export function ReviewRepositoriesPage() {
  const { orgId } = useReviewOrg();
  return (
    <SettingsPage
      title="Repositories"
      description="Where Capy reviews pull requests"
      headerContent={<ReviewAdminNotice scope="repositories" />}
    >
      {orgId === undefined ? (
        <>
          <SettingsSection
            id="review-repositories"
            title="Enabled repositories"
            description={enabledDescription}
          >
            <SettingsLoadingCard />
          </SettingsSection>
          <SettingsSection
            title="Your pull requests"
            description={selfDescription}
          >
            <SettingsLoadingCard />
          </SettingsSection>
        </>
      ) : (
        <>
          <EnabledRepositoriesSection orgId={orgId} />
          <SelfReviewSection orgId={orgId} />
        </>
      )}
    </SettingsPage>
  );
}

const enabledDescription =
  "Pull requests in these repositories are reviewed automatically; enabling one bills this organization for its rounds";
const selfDescription =
  "A personal switch; the organization's filters still apply";

function EnabledRepositoriesSection({ orgId }: { orgId: OrgId }) {
  const { isAdmin, adminReason } = useReviewOrg();
  const review = useReviewRepositories(orgId);
  const enabled = review.rows?.filter(isEnabledSetting);
  const addable = (review.rows ?? []).filter(isAddableSetting);
  const [search, setSearch] = useState("");
  const searchable = (enabled?.length ?? 0) >= repoSearchThreshold;
  const visible = searchable
    ? enabled?.filter((row) => matchesRepo(row.repo, search))
    : enabled;
  return (
    <SettingsSection
      id="review-repositories"
      title="Enabled repositories"
      description={enabledDescription}
      action={
        isAdmin ? (
          <AddRepositoryMenu
            repos={addable}
            disabled={review.allBusy}
            onPick={(repo) => review.setMode(repo, "always")}
          />
        ) : undefined
      }
    >
      {enabled !== undefined && enabled.length === 0 ? (
        <ReviewEmptyState>
          {(review.rows?.length ?? 0) === 0
            ? "No repositories in this organization's projects yet"
            : "No repositories are reviewed yet; add one to start"}
        </ReviewEmptyState>
      ) : (
        <AutoReviewTable
          rows={visible}
          total={enabled?.length}
          search={searchable ? search : undefined}
          onSearchChange={searchable ? setSearch : undefined}
          busyRepos={review.pending}
          allBusy={review.allBusy}
          statusChecks={review.statusChecks}
          isAdmin={isAdmin}
          adminReason={adminReason}
          onSetMode={review.setMode}
          onSetStatusCheck={review.setStatusCheck}
          projects={review.projects}
          onSetProject={review.setProject}
        />
      )}
    </SettingsSection>
  );
}

function AddRepositoryMenu({
  repos,
  disabled,
  onPick,
}: {
  repos: ReadonlyArray<ReviewSetting>;
  disabled: boolean;
  onPick: (repo: string) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = repos.filter((row) => matchesRepo(row.repo, search));
  const empty = repos.length === 0;
  return (
    <Menu onOpenChange={(open) => !open && setSearch("")}>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || empty}
            title={empty ? "No repositories to add" : undefined}
            aria-label="Add a repository to automatic reviews"
          >
            <ButtonIcon>
              <PlusIcon />
            </ButtonIcon>
            Add repository
          </Button>
        }
      />
      <MenuContent align="end" className="w-72">
        {repos.length >= repoSearchThreshold && (
          <div className="p-1 pb-2">
            <Input
              size="sm"
              variant="blank"
              placeholder="Search repositories"
              aria-label="Search repositories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (!["Escape", "ArrowDown", "ArrowUp"].includes(event.key))
                  event.stopPropagation();
              }}
            />
          </div>
        )}
        {matches.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground-2">
            No repositories match
          </div>
        ) : (
          matches.map((row) => (
            <MenuItem key={row.repo} onClick={() => onPick(row.repo)}>
              <MenuRowLabel label={<RepoName repo={row.repo} />} />
            </MenuItem>
          ))
        )}
      </MenuContent>
    </Menu>
  );
}

const columnsWithMemory = [
  `minmax(${spacing(40)},3fr)`,
  `minmax(${spacing(37.5)},auto)`,
  "minmax(0,auto)",
  `minmax(${spacing(24)},auto)`,
  `minmax(${spacing(30)},auto)`,
];
const columnsWithoutMemory = columnsWithMemory.filter(
  (track) => track !== "minmax(0,auto)",
);

function AutoReviewTable({
  rows,
  total,
  search,
  onSearchChange,
  busyRepos,
  allBusy,
  statusChecks,
  isAdmin,
  adminReason,
  onSetMode,
  onSetStatusCheck,
  projects,
  onSetProject,
}: {
  rows: ReadonlyArray<ReviewSetting> | undefined;
  total?: number;
  search?: string;
  onSearchChange?: (search: string) => void;
  busyRepos: ReadonlyMap<string, number>;
  allBusy: boolean;
  statusChecks: ReadonlyMap<string, boolean>;
  isAdmin: boolean;
  adminReason?: string;
  onSetMode: (repo: string, mode: AutoReviewMode) => void;
  onSetStatusCheck: (repo: string, on: boolean) => void;
  projects?: ReadonlyArray<Project>;
  onSetProject?: (repo: string, projectId: string) => void;
}) {
  if (rows === undefined) return <SettingsLoadingCard />;
  if ((total ?? rows.length) === 0)
    return (
      <ReviewEmptyState>
        No repositories in this organization's projects yet
      </ReviewEmptyState>
    );
  return (
    <div className="flex flex-col gap-3">
      {onSearchChange && (
        <Input
          placeholder="Search repositories"
          aria-label="Search repositories"
          value={search ?? ""}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      )}
      <ReviewTable
        card
        cardClassName="overflow-x-auto"
        density="pick"
        columns={
          projects === undefined ? columnsWithoutMemory : columnsWithMemory
        }
      >
        <ReviewTableHeader>
          <ReviewTableHead>Repository</ReviewTableHead>
          <ReviewTableHead>Billing</ReviewTableHead>
          {projects !== undefined && <ReviewTableHead>Memory</ReviewTableHead>}
          <ReviewTableHead className="justify-end">
            Status check
          </ReviewTableHead>
          <ReviewTableHead className="justify-end">Auto review</ReviewTableHead>
        </ReviewTableHeader>
        {rows.length === 0 ? (
          <ReviewTableRow interactive={false}>
            <ReviewTableCell className="col-span-full">
              No repositories match
            </ReviewTableCell>
          </ReviewTableRow>
        ) : (
          rows.map((row) => {
            const elsewhere = heldElsewhere(row);
            const busy = allBusy || busyRepos.has(row.repo);
            const matching = (projects ?? []).filter(
              (project) =>
                !project.deleted &&
                project.repos.some(
                  (repo) =>
                    repo.repoFullName.toLowerCase() === row.repo.toLowerCase(),
                ),
            );
            const current = matching.find(
              (project) => project.id === row.projectId,
            );
            const lockedTitle = elsewhere ? heldElsewhereReason : adminReason;
            return (
              <ReviewTableRow key={row.repo}>
                <ReviewTableCell>
                  <RepoName repo={row.repo} />
                </ReviewTableCell>
                <ReviewTableCell>
                  {row.heldByCaller
                    ? "This organization"
                    : elsewhere
                      ? "Another organization"
                      : "—"}
                </ReviewTableCell>
                {projects !== undefined && (
                  <ReviewTableCell>
                    {!isAdmin ? (
                      <span>
                        {current?.name ??
                          (matching.length === 1 ? matching[0]?.name : "—")}
                      </span>
                    ) : matching.length <= 1 || onSetProject === undefined ? (
                      <span
                        className="truncate text-muted-foreground-2"
                        title={matching[0]?.name}
                      >
                        {matching[0]?.name ?? "—"}
                      </span>
                    ) : (
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={elsewhere || busy}
                              title={lockedTitle}
                              aria-label={`${row.repo} project memory`}
                            >
                              {current?.name ?? "Choose project"}
                              <ChevronDownIcon />
                            </Button>
                          }
                        />
                        <MenuContent align="start" className="w-72">
                          {matching.map((project) => (
                            <MenuItem
                              key={project.id}
                              onClick={() => {
                                if (project.id !== row.projectId)
                                  onSetProject(row.repo, project.id);
                              }}
                            >
                              <MenuRowLabel
                                label={project.name}
                                trailing={
                                  project.id === row.projectId ? (
                                    <CheckIcon className={checkClass} />
                                  ) : null
                                }
                              />
                            </MenuItem>
                          ))}
                        </MenuContent>
                      </Menu>
                    )}
                  </ReviewTableCell>
                )}
                <ReviewTableCell className="justify-end">
                  {isAdmin ? (
                    <Switch
                      checked={
                        statusChecks.get(row.repo) ?? row.postStatusCheck
                      }
                      disabled={allBusy}
                      aria-label={`${row.repo} review status check`}
                      onCheckedChange={(on) => onSetStatusCheck(row.repo, on)}
                    />
                  ) : (
                    <span>{row.postStatusCheck ? "On" : "Off"}</span>
                  )}
                </ReviewTableCell>
                <ReviewTableCell className="justify-end">
                  {isAdmin ? (
                    <AutoReviewModeMenu
                      value={row.autoReview}
                      onPick={(mode) => onSetMode(row.repo, mode)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={elsewhere || busy}
                          title={elsewhere ? heldElsewhereReason : undefined}
                          aria-label={`${row.repo} automatic reviews`}
                        >
                          {autoReviewLabel(row.autoReview)}
                          <ChevronDownIcon />
                        </Button>
                      }
                    />
                  ) : (
                    <span>{autoReviewLabel(row.autoReview)}</span>
                  )}
                </ReviewTableCell>
              </ReviewTableRow>
            );
          })
        )}
      </ReviewTable>
    </div>
  );
}

function SelfReviewSection({ orgId }: { orgId: OrgId }) {
  const policy = useQuery(selfAuthorPolicyAtom(orgId)).value as
    | SelfAuthorPolicy
    | undefined;
  const setPolicy = useAtomSet(setSelfAuthorPolicyAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const onSetSelf = (reviewed: boolean) => {
    setBusy(true);
    setPolicy({
      params: { orgId },
      payload: { reviewed },
      reactivityKeys: [reviewReactivityKeys.selfPolicy(orgId)],
    })
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, "Could not update reviews on your pull requests"),
        ),
      )
      .finally(() => setBusy(false));
  };
  return (
    <SettingsSection title="Your pull requests" description={selfDescription}>
      {policy === undefined ? (
        <SettingsLoadingCard />
      ) : (
        <Card rows>
          <SettingsRow
            id="review-your-prs"
            label="Automatic reviews on your pull requests"
            description={settingsSubtitle(policy)}
          >
            <Switch
              checked={policy.selfReviewed === true}
              disabled={busy || policy.selfLogin === null}
              aria-label="Automatic reviews on your pull requests"
              onCheckedChange={onSetSelf}
            />
          </SettingsRow>
        </Card>
      )}
    </SettingsSection>
  );
}
