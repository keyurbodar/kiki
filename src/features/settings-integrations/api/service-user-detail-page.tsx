import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import type {
  ServiceUserDetail,
  ServiceUserRole,
  UpdateServiceUserRequest,
} from "@/data/api/schemas/api-keys";
import { type OrgId, ProjectId, UserId } from "@/data/api/schemas/ids";
import {
  apiKeysAtom,
  apiSettingsKeys,
  disableServiceUser,
  replaceServiceUserProjects,
  restoreServiceUser,
  serviceUserAtom,
  serviceUserKey,
  serviceUsersAtom,
  setServiceUserSubscription,
  updateServiceUser,
} from "@/data/atoms/api-keys";
import { projectsAtom } from "@/data/atoms/projects";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input, InputGroup } from "@/primitives/input";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuSearchRow,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { toast } from "@/primitives/toaster";
import {
  SettingsPage,
  SettingsRow,
  SettingsRowLink,
  SettingsSection,
  useActiveOrgId,
  useActiveOrgRead,
  useResultValue,
} from "../shared";
import { CreateApiKeyDialog } from "./api-dialogs";
import {
  errorMessage,
  parseSpendCap,
  pluralize,
  roleDescription,
  roleLabels,
  spendCapInput,
  unreachedProjects,
} from "./api-state";
import { ApiKeyIcon, ChevronDownSmallIcon, ProjectIcon } from "./icons";
import {
  ConfirmDialog,
  CopyValue,
  EditablePageDescription,
  EditablePageTitle,
  StatusDot,
} from "./parts";
import {
  useCurrentUserId,
  useOrgAdmin,
  useQueryState,
} from "./use-api-context";

const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

const subscriptionServiceLabels: Record<string, string> = {
  codex: "Codex",
  copilot: "Copilot",
  supergrok: "SuperGrok",
  claude: "Claude",
};

const serviceLabel = (service: string) =>
  service === "unsupported"
    ? "an unsupported service"
    : (subscriptionServiceLabels[service] ?? service);

export function ServiceUserDetailPage({
  serviceUserId,
}: {
  serviceUserId: string;
}) {
  const orgId = useActiveOrgId();
  const orgRead = useActiveOrgRead();
  // A failed organizations read is not a service user that is still loading.
  if (AsyncResult.isFailure(orgRead))
    return <ServiceUserUnavailable loading={false} />;
  if (orgId === undefined) return <ServiceUserUnavailable loading />;
  return <ServiceUserLoader orgId={orgId} serviceUserId={serviceUserId} />;
}

function ServiceUserUnavailable({
  loading,
  onRetry,
}: {
  loading: boolean;
  onRetry?: () => void;
}) {
  return (
    <SettingsPage title="Service user">
      <Card>
        <SettingsRow
          label={loading ? "Loading service user" : "Service user unavailable"}
          description={
            loading
              ? "Loading service-user details"
              : "This service user may be unavailable in the selected organization"
          }
        >
          {loading ? (
            <SkeletonPanel className="h-7 w-20" />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<Link to="/settings/api">Back to API</Link>}
              />
            </>
          )}
        </SettingsRow>
      </Card>
    </SettingsPage>
  );
}

function ServiceUserLoader({
  orgId,
  serviceUserId,
}: {
  orgId: OrgId;
  serviceUserId: string;
}) {
  const atom = serviceUserAtom(serviceUserKey(orgId, serviceUserId));
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const row = useResultValue(atom);
  if (row === undefined)
    return (
      <ServiceUserUnavailable
        loading={AsyncResult.isInitial(result)}
        onRetry={refresh}
      />
    );
  return (
    <ServiceUserDetailContent
      key={DateTime.formatIso(row.updatedAt)}
      orgId={orgId}
      row={row}
    />
  );
}

type Access = Pick<ServiceUserDetail, "projectAccessMode" | "projectIds">;

function ServiceUserDetailContent({
  orgId,
  row,
}: {
  orgId: OrgId;
  row: ServiceUserDetail;
}) {
  const admin = useOrgAdmin();
  const viewerId = useCurrentUserId();
  const projects = useQueryState(projectsAtom(orgId));
  const allUsers = useQueryState(serviceUsersAtom(orgId));
  const keys = useQueryState(apiKeysAtom(orgId));
  const update = useAtomSet(updateServiceUser, { mode: "promise" });
  const disable = useAtomSet(disableServiceUser, { mode: "promise" });
  const restore = useAtomSet(restoreServiceUser, { mode: "promise" });
  const replaceProjects = useAtomSet(replaceServiceUserProjects, {
    mode: "promise",
  });
  const setSubscription = useAtomSet(setServiceUserSubscription, {
    mode: "promise",
  });

  const [spendCap, setSpendCap] = useState(
    spendCapInput(row.monthlySpendCapCredits),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [access, setAccess] = useState<Access>({
    projectAccessMode: row.projectAccessMode,
    projectIds: [...row.projectIds],
  });

  const keysForUser = keys.rows.filter(
    (key) => key.principalKind === "service" && key.principalUserId === row.id,
  );
  const reasons = { orgId, serviceUserId: row.id };
  const keysRefresh = apiSettingsKeys.apiSettings(orgId);

  const save = (
    payload: typeof UpdateServiceUserRequest.Type,
    action: string,
    success: string,
  ) =>
    update({ params: reasons, payload, reactivityKeys: keysRefresh }).then(
      () => {
        toast.success(success);
        return true;
      },
      (error: unknown) => {
        toast.error(errorMessage(error, `Could not ${action}`));
        return false;
      },
    );

  const saveExclusive = (
    payload: typeof UpdateServiceUserRequest.Type,
    action: string,
    success: string,
  ) => {
    if (pending !== null) return Promise.resolve(false);
    setPending(action);
    return save(payload, action, success).finally(() => setPending(null));
  };

  const saveSpendCap = () => {
    if (spendCap === spendCapInput(row.monthlySpendCapCredits)) return;
    const credits = parseSpendCap(spendCap);
    if (credits === "invalid") {
      toast.error("Spend cap must be a positive dollar amount");
      return;
    }
    void save(
      { monthlySpendCapCredits: credits },
      "save monthly spend cap",
      "Monthly spend cap saved",
    );
  };

  const commitProjects = (next: Access) => {
    if (pending !== null) return;
    setPending("change allowed projects");
    replaceProjects({
      params: reasons,
      payload: {
        projectAccessMode: next.projectAccessMode,
        projectIds: [...next.projectIds],
      },
      reactivityKeys: keysRefresh,
    })
      .then(() => toast.success("Project access changed"))
      .catch((error: unknown) => {
        setAccess({
          projectAccessMode: row.projectAccessMode,
          projectIds: [...row.projectIds],
        });
        toast.error(errorMessage(error, "Could not change project access"));
      })
      .finally(() => setPending(null));
  };

  const connectSubscriptions = (ownerUserId: string | null) => {
    setPending("change external subscriptions");
    setSubscription({
      params: reasons,
      payload: {
        ownerUserId: ownerUserId === null ? null : UserId.make(ownerUserId),
      },
      reactivityKeys: keysRefresh,
    })
      .then(() =>
        toast.success(
          ownerUserId === null
            ? "Subscriptions disconnected"
            : "Subscriptions connected",
        ),
      )
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, "Could not change external subscriptions"),
        ),
      )
      .finally(() => setPending(null));
  };

  const lockedReason =
    row.role === "admin" && !admin.isAdmin
      ? "Only organization admins can change admin service users"
      : undefined;

  const visibleProjects = projects.rows.filter((project) =>
    `${project.name} ${project.description ?? ""}`
      .toLowerCase()
      .includes(projectQuery.trim().toLowerCase()),
  );
  const selectedProjects = projects.rows.filter((project) =>
    access.projectIds.includes(project.id),
  );
  const hiddenCount = access.projectIds.filter(
    (id) => !selectedProjects.some((project) => project.id === id),
  ).length;
  const accessSummary =
    access.projectAccessMode === "all_org_projects"
      ? "All organization projects"
      : [
          selectedProjects.length === 0
            ? "No projects"
            : selectedProjects.length === 1
              ? (selectedProjects[0]?.name ?? "")
              : `${selectedProjects.length} projects`,
          ...(hiddenCount > 0 ? [`${hiddenCount} hidden`] : []),
        ].join(", ");

  const servicesText = row.subscriptionServices.map(serviceLabel).join(", ");
  const subscriptionOwner =
    row.subscriptionOwnerUserId === viewerId
      ? "You"
      : row.subscriptionOwnerUserId;

  const keyDialogUsers = allUsers.rows.some((user) => user.id === row.id)
    ? allUsers.rows
    : [row];

  const projectAccessControl: ReactNode = projects.loading ? (
    <SkeletonPanel className="h-7 w-48" />
  ) : (
    <Menu
      open={projectsOpen}
      onOpenChange={(open) => {
        setProjectsOpen(open);
        if (open) {
          setAccess({
            projectAccessMode: row.projectAccessMode,
            projectIds: [...row.projectIds],
          });
          return;
        }
        setProjectQuery("");
        const idsChanged =
          row.projectAccessMode !== "all_org_projects" ||
          access.projectAccessMode !== "all_org_projects"
            ? access.projectIds.length !== row.projectIds.length ||
              access.projectIds.some((id) => !row.projectIds.includes(id))
            : false;
        if (access.projectAccessMode !== row.projectAccessMode || idsChanged)
          commitProjects(access);
      }}
    >
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-52 justify-between"
            disabled={!projects.loaded || pending !== null}
          >
            <span className="min-w-0 truncate">{accessSummary}</span>
            <ChevronDownSmallIcon />
          </Button>
        }
      />
      <MenuContent className="w-72">
        <MenuSearchRow>
          <input
            aria-label="Search projects"
            placeholder="Search projects"
            // biome-ignore lint/a11y/noAutofocus: Capy focuses the project search when the menu opens
            autoFocus
            className={menuSearchInput}
            value={projectQuery}
            onChange={(event) => setProjectQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key !== "Escape" &&
                event.key !== "ArrowDown" &&
                event.key !== "ArrowUp"
              )
                event.stopPropagation();
            }}
          />
        </MenuSearchRow>
        <MenuCheckboxItem
          checked={access.projectAccessMode === "all_org_projects"}
          onCheckedChange={(checked) =>
            setAccess({
              projectAccessMode: checked ? "all_org_projects" : "allowlist",
              projectIds: [],
            })
          }
        >
          All organization projects
        </MenuCheckboxItem>
        <MenuSeparator />
        {visibleProjects.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            {projects.rows.length === 0
              ? "No projects available"
              : "No matching projects"}
          </div>
        ) : (
          visibleProjects.map((project) => (
            <MenuCheckboxItem
              key={project.id}
              checked={
                access.projectAccessMode === "all_org_projects" ||
                access.projectIds.includes(project.id)
              }
              disabled={access.projectAccessMode === "all_org_projects"}
              onCheckedChange={(checked) =>
                setAccess({
                  projectAccessMode: "allowlist",
                  projectIds: checked
                    ? [...access.projectIds, ProjectId.make(project.id)]
                    : access.projectIds.filter((id) => id !== project.id),
                })
              }
            >
              <ProjectIcon icon={project.icon} className="size-(--icon-sm)" />
              <span className="min-w-0 truncate">{project.name}</span>
            </MenuCheckboxItem>
          ))
        )}
      </MenuContent>
    </Menu>
  );

  return (
    <>
      <SettingsPage
        title={row.name}
        icon={
          <Button
            variant="ghost"
            size="icon-base"
            aria-label="Change service user icon"
          >
            <ProjectIcon icon={row.icon} className="size-6" />
          </Button>
        }
        headerFields={
          <>
            <EditablePageTitle
              key={row.name}
              value={row.name}
              ariaLabel="Service-user name"
              maxLength={255}
              onSave={(name) =>
                save(
                  { name },
                  "save service-user name",
                  "Service-user name saved",
                )
              }
            />
            <EditablePageDescription
              key={row.description ?? ""}
              value={row.description}
              ariaLabel="Service-user description"
              maxLength={5000}
              onSave={(description) =>
                save(
                  { description },
                  "save service-user description",
                  "Service-user description saved",
                )
              }
            />
          </>
        }
      >
        <SettingsSection title="Details">
          <Card rows>
            <SettingsRow label="Service-user ID">
              <CopyValue
                className="w-56"
                size="sm"
                value={row.id}
                label="service-user ID"
              />
            </SettingsRow>
            <SettingsRow label="Role" description={roleDescription(row.role)}>
              <MenuSelect
                items={roleLabels}
                value={row.role}
                onValueChange={(role) =>
                  void saveExclusive(
                    { role: role as ServiceUserRole },
                    "change service-user role",
                    "Service-user role changed",
                  )
                }
                disabled={pending !== null || lockedReason !== undefined}
              >
                <MenuSelectTrigger className="w-32" title={lockedReason}>
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent>
                  <MenuSelectItem value="read_only">Read-only</MenuSelectItem>
                  <MenuSelectItem value="read_write">Read-write</MenuSelectItem>
                  <MenuSelectItem value="admin" disabled={!admin.isAdmin}>
                    Admin
                  </MenuSelectItem>
                </MenuSelectContent>
              </MenuSelect>
            </SettingsRow>
            <SettingsRow
              label="Status"
              description={
                row.disabledAt === null
                  ? "Active keys can authenticate as this service user"
                  : "Every key is blocked until this service user is restored"
              }
            >
              {row.disabledAt === null ? (
                <Badge color="neutral">
                  <StatusDot color="success" />
                  Enabled
                </Badge>
              ) : (
                <Badge color="neutral">Disabled</Badge>
              )}
              {row.disabledAt === null ? (
                <Button
                  size="sm"
                  variant="ghost"
                  intent="danger"
                  disabled={lockedReason !== undefined || pending !== null}
                  title={lockedReason}
                  onClick={() => setConfirmingDisable(true)}
                >
                  Disable
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={lockedReason !== undefined || pending !== null}
                  title={lockedReason}
                  onClick={() => {
                    setPending("restore service user");
                    restore({ params: reasons, reactivityKeys: keysRefresh })
                      .then(() => toast.success("Service user restored"))
                      .catch((error: unknown) =>
                        toast.error(
                          errorMessage(error, "Could not restore service user"),
                        ),
                      )
                      .finally(() => setPending(null));
                  }}
                >
                  Restore
                </Button>
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="Project access">
          <Card>
            <SettingsRow
              label="Project access"
              description={
                projects.loaded
                  ? accessSummary
                  : projects.loading
                    ? "Loading organization projects"
                    : "Project data unavailable"
              }
            >
              {!projects.loaded && !projects.loading && (
                <Button variant="ghost" size="sm" onClick={projects.refresh}>
                  Retry
                </Button>
              )}
              {projectAccessControl}
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="Model access">
          <Card rows>
            <SettingsRow
              label="Default model"
              description={
                row.model === null
                  ? "Not set, so its API keys use the organization default"
                  : "Used when its API keys start a thread without a model"
              }
            >
              <Button variant="ghost" size="sm" disabled={pending !== null}>
                {row.model === null
                  ? "Organization default"
                  : row.model.modelId}
              </Button>
            </SettingsRow>
            <SettingsRow
              label="External subscriptions"
              description={
                row.subscriptionOwnerUserId === null
                  ? "Use your connected subscriptions for this service user"
                  : `Connected to ${subscriptionOwner}, ${servicesText === "" ? "no active subscriptions" : `serves ${servicesText}`}`
              }
            >
              {row.subscriptionOwnerUserId === null ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={viewerId === undefined || pending !== null}
                  onClick={() =>
                    viewerId !== undefined && connectSubscriptions(viewerId)
                  }
                >
                  Use my subscriptions
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  intent="danger"
                  disabled={pending !== null}
                  onClick={() => setConfirmingDisconnect(true)}
                >
                  Disconnect
                </Button>
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="Spending">
          <Card>
            <SettingsRow
              label="Monthly spend cap"
              description="Blank means uncapped; blocks new billable work at the current-month limit"
            >
              <InputGroup className="w-28">
                <span className="text-sm">$</span>
                <Input
                  size="sm"
                  className="text-right tabular-nums"
                  aria-label="Monthly spend cap in dollars"
                  value={spendCap}
                  onChange={(event) => setSpendCap(event.target.value)}
                  onBlur={saveSpendCap}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape")
                      setSpendCap(spendCapInput(row.monthlySpendCapCredits));
                  }}
                  inputMode="decimal"
                  placeholder="Uncapped"
                  disabled={!admin.isAdmin}
                  title={admin.adminReason}
                />
              </InputGroup>
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="API access">
          <Card rows>
            <SettingsRow
              label="API keys"
              icon={<ApiKeyIcon />}
              description={
                keys.loaded ? (
                  <Link
                    to="/settings/api"
                    hash="public-api-keys"
                    className="text-text-link hover:underline"
                  >
                    {keysForUser.filter((key) => key.revokedAt === null).length}{" "}
                    unrevoked for this service user
                  </Link>
                ) : keys.loading ? (
                  "Loading API key count"
                ) : (
                  "API key count unavailable"
                )
              }
            >
              {!keys.loaded && !keys.loading && (
                <Button variant="ghost" size="sm" onClick={keys.refresh}>
                  Retry
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCreatingKey(true)}
              >
                Create API key
              </Button>
            </SettingsRow>
            {keysForUser.flatMap((key) => {
              const unreached = unreachedProjects(key).length;
              return unreached === 0
                ? []
                : [
                    <SettingsRowLink
                      key={key.id}
                      to="/settings/api/key/$keyId"
                      params={{ keyId: key.id }}
                      label={key.name}
                      description="Its creator isn't a member of every private project"
                      icon={<ApiKeyIcon />}
                    >
                      <Badge color="warning">
                        {pluralize(unreached, "private project")} not reached
                      </Badge>
                    </SettingsRowLink>,
                  ];
            })}
          </Card>
        </SettingsSection>
      </SettingsPage>
      <ConfirmDialog
        open={confirmingDisable}
        onOpenChange={setConfirmingDisable}
        title={`Disable ${row.name}?`}
        description="Every API key for this service user stops authenticating until it is restored"
        confirmLabel="Disable"
        onConfirm={() => {
          setPending("disable service user");
          disable({ params: reasons, reactivityKeys: keysRefresh })
            .then(() => toast.success("Service user disabled"))
            .catch((error: unknown) =>
              toast.error(
                errorMessage(error, "Could not disable service user"),
              ),
            )
            .finally(() => setPending(null));
        }}
      />
      <CreateApiKeyDialog
        open={creatingKey}
        onOpenChange={setCreatingKey}
        orgId={orgId}
        serviceUsers={keyDialogUsers}
        lockedServiceUserId={row.id}
      />
      <ConfirmDialog
        open={confirmingDisconnect}
        onOpenChange={setConfirmingDisconnect}
        title="Disconnect external subscriptions?"
        description="Future model requests from this service user stop using the connected subscriptions"
        confirmLabel="Disconnect"
        onConfirm={() => connectSubscriptions(null)}
      />
    </>
  );
}
