import { useAtomSet } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import type {
  CloudAccess,
  CloudAccessTarget,
  CloudProvider,
} from "@/data/api/schemas/cloud-access";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import {
  cloudAccessKeys,
  deleteCloudAccessTargetAtom,
} from "@/data/atoms/cloud-credentials";
import { Button, ButtonIcon } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  MenuCombobox,
  MenuComboboxContent,
  MenuComboboxItem,
  MenuComboboxList,
  MenuComboboxTrigger,
} from "@/primitives/menu-combobox";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  CardListHeader,
  SettingsLoadFailedRow,
  SettingsPage,
  SettingsRow,
  SettingsRowLink,
  SettingsSection,
  useActiveOrgId,
} from "../shared";
import { oidcExampleToken } from "./commands";
import { formatRecent } from "./format";
import {
  errorMessage,
  useCheckTarget,
  useCloudAccess,
  useIsOrgAdmin,
  useProjects,
} from "./hooks";
import {
  ChevronDownSmallIcon,
  CloudIcon,
  DotsHorizontalIcon,
  RotateClockwiseIcon,
  TrashIcon,
} from "./icons";
import {
  CodeBlock,
  ConfirmDialog,
  CopyValue,
  menuItemIconClass,
} from "./parts";
import {
  onlyAdminsCanChangeOidc,
  onlyAdminsCanRemove,
  providerOrder,
  providerRoutes,
  providers,
} from "./providers";
import { projectCountLabel, projectsCardLabel } from "./status";
import { CheckBadge, ProviderStatusBadge } from "./status-badges";
import { oidcTokenFileVar } from "./validation";

const loadFailedLabel = "Could not load cloud credentials";

export function WithOrg({
  children,
}: {
  children: (orgId: OrgId) => ReactNode;
}) {
  const orgId = useActiveOrgId();
  return orgId === undefined ? null : children(orgId);
}

export function RemoveDialog({
  orgId,
  target,
  projectName,
  onClose,
  onRemoved,
}: {
  orgId: OrgId;
  target: CloudAccessTarget;
  projectName: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const remove = useAtomSet(deleteCloudAccessTargetAtom, { mode: "promise" });
  const [loading, setLoading] = useState(false);
  const meta = providers[target.provider];
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        target.provider === "oidc"
          ? `Remove ${target.audience} from ${projectName}?`
          : `Remove ${projectName} from ${meta.name}?`
      }
      description={`${meta.removedEffect}, ${meta.keptSetup}`}
      confirmLabel="Remove"
      loading={loading}
      closeOnConfirm={false}
      onConfirm={() => {
        setLoading(true);
        remove({
          params: { orgId, targetId: target.id },
          reactivityKeys: cloudAccessKeys.cloudAccess(orgId),
        })
          .then(() => {
            toast.success(`Removed ${projectName} from ${meta.name}`);
            onRemoved();
          })
          .catch((error: unknown) => {
            toast.error(errorMessage(error, "Could not remove the project"));
          })
          .finally(() => setLoading(false));
      }}
    />
  );
}

export function RemoveSection({
  orgId,
  provider,
  onRemove,
}: {
  orgId: OrgId;
  provider: CloudProvider;
  onRemove: () => void;
}) {
  const isAdmin = useIsOrgAdmin(orgId);
  const meta = providers[provider];
  return (
    <SettingsSection>
      <Card>
        <SettingsRow
          label={`Remove from ${meta.name}`}
          description={meta.removedEffect}
        >
          {isAdmin ? (
            <Button
              variant="ghost"
              intent="danger"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span>
                    <Button variant="ghost" intent="danger" size="sm" disabled>
                      Remove
                    </Button>
                  </span>
                }
              />
              <TooltipContent side="top">{onlyAdminsCanRemove}</TooltipContent>
            </Tooltip>
          )}
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}

export function SetupLoader({
  provider,
  targetId,
  children,
}: {
  provider: CloudProvider;
  targetId: string | undefined;
  children: (
    orgId: OrgId,
    access: CloudAccess,
    target: CloudAccessTarget | undefined,
  ) => ReactNode;
}) {
  return (
    <WithOrg>
      {(orgId) => (
        <SetupLoaderBody orgId={orgId} provider={provider} targetId={targetId}>
          {children}
        </SetupLoaderBody>
      )}
    </WithOrg>
  );
}

function SetupLoaderBody({
  orgId,
  provider,
  targetId,
  children,
}: {
  orgId: OrgId;
  provider: CloudProvider;
  targetId: string | undefined;
  children: (
    orgId: OrgId,
    access: CloudAccess,
    target: CloudAccessTarget | undefined,
  ) => ReactNode;
}) {
  const { result, access, failed, refresh } = useCloudAccess(orgId);
  const meta = providers[provider];
  const target = access?.targets.find(
    (row) => row.id === targetId && row.provider === provider,
  );
  if (
    access !== undefined &&
    (targetId === undefined || target !== undefined)
  ) {
    return children(orgId, access, target);
  }
  if (targetId === undefined) {
    return (
      <SettingsPage
        title="Add project"
        icon={meta.icon}
        iconTile={meta.iconTile}
      >
        {failed ? (
          <Card>
            <SettingsLoadFailedRow label={loadFailedLabel} onRetry={refresh} />
          </Card>
        ) : (
          <Card className="p-4">
            <SkeletonPanel className="h-24 w-full" />
          </Card>
        )}
      </SettingsPage>
    );
  }
  if ((access === undefined && !failed) || (result.waiting && !failed)) {
    return (
      <SettingsPage title={meta.name} icon={meta.icon} iconTile={meta.iconTile}>
        <Card>
          <SettingsRow
            label="Loading project"
            description="Reading cloud credentials"
            descriptionTone="strong"
          >
            <SkeletonPanel className="h-7 w-20" />
          </SettingsRow>
        </Card>
      </SettingsPage>
    );
  }
  return (
    <SettingsPage title={meta.name} icon={meta.icon} iconTile={meta.iconTile}>
      <Card>
        <SettingsRow
          label={failed ? loadFailedLabel : "Project not found"}
          description={
            failed
              ? "Check your connection and try again"
              : `This project no longer uses ${meta.name}`
          }
          descriptionTone="strong"
        >
          <Button variant="ghost" size="sm" onClick={refresh}>
            Retry
          </Button>
          {failed ? null : (
            <Button
              variant="ghost"
              size="sm"
              render={<Link to={providerRoutes[provider].list} />}
            >
              All projects
            </Button>
          )}
        </SettingsRow>
      </Card>
    </SettingsPage>
  );
}

function IssuerCard({
  access,
  children,
}: {
  access: CloudAccess | undefined;
  children?: ReactNode;
}) {
  const rows = [
    { label: "Issuer URL", copyLabel: "issuer URL", value: access?.issuer },
    {
      label: "Discovery URL",
      copyLabel: "discovery URL",
      value: access?.discoveryUrl,
    },
    { label: "JWKS URL", copyLabel: "JWKS URL", value: access?.jwksUrl },
  ];
  return (
    <Card rows>
      {rows.map((row) => (
        <SettingsRow
          key={row.label}
          label={row.label}
          wrapValue
          className="items-center"
        >
          {row.value === undefined ? (
            <SkeletonPanel className="h-4 w-64" />
          ) : (
            <CopyValue
              className="w-80"
              value={row.value}
              label={row.copyLabel}
            />
          )}
        </SettingsRow>
      ))}
      {children}
    </Card>
  );
}

export function CloudCredentialsPage() {
  return (
    <SettingsPage
      title="Cloud credentials"
      description="Machines sign in to your cloud with short-lived OIDC tokens, no keys stored"
      icon={<CloudIcon />}
    >
      <WithOrg>{(orgId) => <CloudCredentialsBody orgId={orgId} />}</WithOrg>
    </SettingsPage>
  );
}

function CloudCredentialsBody({ orgId }: { orgId: OrgId }) {
  const { access, failed, refresh } = useCloudAccess(orgId);
  if (access === undefined && failed) {
    return (
      <Card>
        <SettingsLoadFailedRow label={loadFailedLabel} onRetry={refresh} />
      </Card>
    );
  }
  return (
    <>
      <SettingsSection
        title="Issuer"
        description="Your cloud trusts tokens Capy signs for this organization"
      >
        <IssuerCard access={access} />
      </SettingsSection>
      <SettingsSection title="Clouds">
        <Card rows>
          {providerOrder.map((provider) => {
            const targets =
              access?.targets.filter((t) => t.provider === provider) ?? [];
            const projectCount = new Set(targets.map((t) => t.projectId)).size;
            const meta = providers[provider];
            return (
              <SettingsRowLink
                key={provider}
                to={providerRoutes[provider].list}
                label={meta.name}
                description={meta.description}
                icon={meta.icon}
                iconTile={meta.iconTile}
              >
                {targets.length === 0 ? null : (
                  <span className="hidden text-xs text-muted-foreground-2 tabular-nums sm:inline">
                    {projectCountLabel(projectCount)}
                  </span>
                )}
                {access === undefined ? null : (
                  <ProviderStatusBadge targets={targets} />
                )}
              </SettingsRowLink>
            );
          })}
        </Card>
      </SettingsSection>
    </>
  );
}

const pageSize = 25;

function ProjectsCard({
  orgId,
  provider,
}: {
  orgId: OrgId;
  provider: CloudProvider;
}) {
  const navigate = useNavigate();
  const isAdmin = useIsOrgAdmin(orgId);
  const { access, failed, refresh } = useCloudAccess(orgId);
  const projects = useProjects(orgId);
  const { checking, run } = useCheckTarget(orgId);
  const [removing, setRemoving] = useState<CloudAccessTarget | null>(null);
  const [limit, setLimit] = useState(pageSize);
  const meta = providers[provider];
  const routes = providerRoutes[provider];
  const targets = access?.targets.filter((t) => t.provider === provider) ?? [];
  const noun = provider === "oidc" ? "target" : "project";
  const canAdd = provider !== "oidc" || isAdmin;
  const projectName = (target: CloudAccessTarget) =>
    projects.find((project) => project.id === target.projectId)?.name ??
    "Unknown project";
  const openTarget = (target: CloudAccessTarget) =>
    void navigate({ to: routes.target, params: { targetId: target.id } });

  const describeTarget = (target: CloudAccessTarget) =>
    ({
      gcp: target.gcp?.serviceAccountEmail,
      aws: target.aws?.roleArn,
      azure: target.azure?.clientId,
      vault:
        target.vault === null
          ? undefined
          : `${target.vault.role} on ${target.vault.address}`,
      oidc: target.audience,
    })[provider];

  const removeItem = (target: CloudAccessTarget) => (
    <MenuItem intent="danger" onClick={() => setRemoving(target)}>
      <span className={menuItemIconClass}>
        <TrashIcon />
      </span>
      Remove
    </MenuItem>
  );

  return (
    <SettingsSection>
      <Card rows>
        <CardListHeader
          label={projectsCardLabel(provider, targets.length)}
          tools={
            <Button
              variant="link"
              size="auto-sm"
              className="mr-3"
              render={
                <a
                  href={meta.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Setup guide
            </Button>
          }
          action={
            canAdd ? (
              <Button
                variant={targets.length === 0 ? "solid" : "ghost"}
                intent={targets.length === 0 ? "accent" : undefined}
                size="sm"
                render={<Link to={routes.add} />}
              >
                {`Add ${noun}`}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span>
                      <Button variant="ghost" size="sm" disabled>
                        {`Add ${noun}`}
                      </Button>
                    </span>
                  }
                />
                <TooltipContent side="top">
                  {onlyAdminsCanChangeOidc}
                </TooltipContent>
              </Tooltip>
            )
          }
        />
        {access === undefined ? (
          failed ? (
            <SettingsLoadFailedRow label={loadFailedLabel} onRetry={refresh} />
          ) : (
            <div className="flex flex-col gap-2 p-4">
              <SkeletonPanel className="h-4 w-40" />
              <SkeletonPanel className="h-3 w-72" />
            </div>
          )
        ) : targets.length === 0 ? (
          <div className="flex flex-col gap-1 p-4">
            <span className="text-sm font-medium text-foreground">
              {`No projects use ${meta.name} yet`}
            </span>
            <span className="text-sm font-normal text-muted-foreground-2">
              {meta.emptyDescription}
            </span>
          </div>
        ) : (
          targets.slice(0, limit).map((target) => (
            <SettingsRow
              key={target.id}
              label={projectName(target)}
              description={describeTarget(target)}
              onClick={() => openTarget(target)}
              actions={
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={checking === target.id}
                        aria-busy={checking === target.id || undefined}
                        aria-label={`${projectName(target)} actions`}
                      >
                        <ButtonIcon>
                          <DotsHorizontalIcon />
                        </ButtonIcon>
                      </Button>
                    }
                  />
                  <MenuContent align="end" className="w-44">
                    {meta.checkedByApi ? (
                      <MenuItem onClick={() => void run(target)}>
                        <span className={menuItemIconClass}>
                          <RotateClockwiseIcon />
                        </span>
                        Check now
                      </MenuItem>
                    ) : null}
                    <MenuItem onClick={() => openTarget(target)}>
                      <span className={menuItemIconClass}>
                        <Icon name="pencil" />
                      </span>
                      Edit setup
                    </MenuItem>
                    <MenuSeparator />
                    {isAdmin ? (
                      removeItem(target)
                    ) : (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <div>
                              <MenuItem intent="danger" disabled>
                                <span className={menuItemIconClass}>
                                  <TrashIcon />
                                </span>
                                Remove
                              </MenuItem>
                            </div>
                          }
                        />
                        <TooltipContent side="left">
                          {onlyAdminsCanRemove}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </MenuContent>
                </Menu>
              }
            >
              {target.lastCheck === null ? null : (
                <span className="hidden text-xs text-muted-foreground-2 tabular-nums sm:inline">
                  {formatRecent(
                    new Date(target.lastCheck.at.epochMilliseconds),
                  )}
                </span>
              )}
              <CheckBadge provider={provider} check={target.lastCheck} />
            </SettingsRow>
          ))
        )}
        {targets.length > limit ? (
          <div className="flex justify-center p-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLimit((current) => current + pageSize)}
            >
              Show more
            </Button>
          </div>
        ) : null}
      </Card>
      {removing === null ? null : (
        <RemoveDialog
          orgId={orgId}
          target={removing}
          projectName={projectName(removing)}
          onClose={() => setRemoving(null)}
          onRemoved={() => setRemoving(null)}
        />
      )}
    </SettingsSection>
  );
}

const providerPageDescriptions = {
  gcp: "Workload Identity Federation, no keys stored",
  aws: "IAM roles with web identity, no keys stored",
  vault: "HashiCorp Vault JWT auth, no keys stored",
  azure: "Entra workload identity federation, no keys stored",
} as const;

export function ProviderListPage({
  provider,
}: {
  provider: keyof typeof providerPageDescriptions;
}) {
  const meta = providers[provider];
  return (
    <SettingsPage
      title={meta.name}
      description={providerPageDescriptions[provider]}
      icon={meta.icon}
      iconTile="brand"
    >
      <WithOrg>
        {(orgId) => <ProjectsCard orgId={orgId} provider={provider} />}
      </WithOrg>
    </SettingsPage>
  );
}

export function OidcListPage() {
  return (
    <SettingsPage
      title="Generic OIDC"
      description="Any vendor that trusts a custom OIDC provider, no keys stored"
      icon={providers.oidc.icon}
    >
      <WithOrg>{(orgId) => <OidcListBody orgId={orgId} />}</WithOrg>
    </SettingsPage>
  );
}

function OidcListBody({ orgId }: { orgId: OrgId }) {
  const { access, failed, refresh } = useCloudAccess(orgId);
  if (access === undefined && failed) {
    return (
      <Card>
        <SettingsLoadFailedRow label={loadFailedLabel} onRetry={refresh} />
      </Card>
    );
  }
  return (
    <>
      <SettingsSection
        title="Provider"
        description="Add a custom OIDC provider in your vendor with these values"
      >
        <IssuerCard access={access}>
          <SettingsRow label="Subject">
            <CopyValue
              className="w-80"
              value={`org/${orgId}/project/<project id>/thread/*`}
              label="subject pattern"
            />
          </SettingsRow>
        </IssuerCard>
      </SettingsSection>
      <SettingsSection
        title="Example token"
        description={`Valid for 15 minutes and replaced before it expires, a project's first target is at ${oidcTokenFileVar} and each additional one is a file in $CAPY_OIDC_TOKEN_DIR`}
      >
        <Card className="p-4">
          <CodeBlock
            text={oidcExampleToken(access?.issuer, orgId)}
            language="json"
            blockKey="cloud-access-oidc-example"
          />
        </Card>
      </SettingsSection>
      <ProjectsCard orgId={orgId} provider="oidc" />
    </>
  );
}

export function ProjectCombobox({
  provider,
  access,
  target,
  projects,
  project,
  onProjectId,
}: {
  provider: CloudProvider;
  access: CloudAccess;
  target: CloudAccessTarget | undefined;
  projects: ReadonlyArray<Project>;
  project: Project | undefined;
  onProjectId: (projectId: string | null) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const taken = new Set<string>(
    access.targets.flatMap((row) =>
      provider !== "oidc" && row.provider === provider && row.id !== target?.id
        ? [row.projectId]
        : [],
    ),
  );
  return (
    <MenuCombobox
      items={projects}
      limit={50}
      onValueChange={(value: Project | null) => {
        onProjectId(value?.id ?? null);
        setInputValue("");
      }}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      itemToStringLabel={(item: Project) => item.name}
      isItemEqualToValue={(a: Project, b: Project) => a.id === b.id}
    >
      <MenuComboboxTrigger aria-label="Project" className="justify-between">
        {project === undefined ? (
          <span className="text-muted-foreground-3">Choose a project</span>
        ) : (
          <span className="min-w-0 truncate">{project.name}</span>
        )}
        <ChevronDownSmallIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
      </MenuComboboxTrigger>
      <MenuComboboxContent className="w-64">
        <MenuComboboxList>
          {(item: Project) => (
            <MenuComboboxItem
              key={item.id}
              value={item}
              disabled={taken.has(item.id)}
            >
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {taken.has(item.id) ? (
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
                  Has {providers[provider].name}
                </span>
              ) : null}
            </MenuComboboxItem>
          )}
        </MenuComboboxList>
      </MenuComboboxContent>
    </MenuCombobox>
  );
}
