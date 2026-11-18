import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  ApiKey,
  ApiKeyId,
  ServiceUser,
} from "@/data/api/schemas/api-keys";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  apiKeysAtom,
  apiSettingsKeys,
  renameApiKey,
  revokeApiKey,
  serviceUsersAtom,
} from "@/data/atoms/api-keys";
import { projectsAtom } from "@/data/atoms/projects";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
  useActiveOrgId,
} from "../shared";
import {
  apiKeyState,
  errorMessage,
  formatTimestamp,
  toDate,
} from "./api-state";
import { ProjectIcon } from "./icons";
import {
  ApiKeyStatusBadge,
  ConfirmDialog,
  CopyValue,
  EditablePageTitle,
  StatusDot,
} from "./parts";
import {
  principalName,
  useCurrentUserId,
  useQueryState,
} from "./use-api-context";

export function ApiKeyDetailPage({ keyId }: { keyId: string }) {
  const orgId = useActiveOrgId();
  if (orgId === undefined) return <KeyUnavailable loading />;
  return <ApiKeyDetailLoader orgId={orgId} keyId={keyId} />;
}

function KeyUnavailable({
  loading,
  onRetry,
}: {
  loading: boolean;
  onRetry?: () => void;
}) {
  return (
    <SettingsPage title="API key">
      <Card>
        <SettingsRow
          label={loading ? "Loading API key" : "API key unavailable"}
          description={
            loading
              ? "Loading API-key details"
              : "This key may be unavailable in the selected organization"
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

function ApiKeyDetailLoader({ orgId, keyId }: { orgId: OrgId; keyId: string }) {
  const keys = useQueryState(apiKeysAtom(orgId));
  const apiKey = keys.rows.find((key) => key.id === (keyId as ApiKeyId));
  if (apiKey === undefined)
    return <KeyUnavailable loading={keys.loading} onRetry={keys.refresh} />;
  return <ApiKeyDetailContent key={apiKey.id} orgId={orgId} apiKey={apiKey} />;
}

function ApiKeyDetailContent({
  orgId,
  apiKey,
}: {
  orgId: OrgId;
  apiKey: ApiKey;
}) {
  const viewerId = useCurrentUserId();
  const users = useQueryState(serviceUsersAtom(orgId));
  const projects = useQueryState(projectsAtom(orgId));
  const rename = useAtomSet(renameApiKey, { mode: "promise" });
  const revoke = useAtomSet(revokeApiKey, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const focusAfterRevoke = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const principal: ServiceUser | undefined =
    apiKey.principalKind === "service"
      ? users.rows.find((user) => user.id === apiKey.principalUserId)
      : undefined;
  const projectName = (projectId: string) =>
    projects.rows.find((project) => project.id === projectId)?.name ??
    projectId;
  const state = apiKeyState(
    apiKey,
    new Map<string, ServiceUser>(users.rows.map((user) => [user.id, user])),
  );

  useEffect(() => {
    if (focusAfterRevoke.current && apiKey.revokedAt !== null && !busy) {
      headingRef.current?.focus();
      focusAfterRevoke.current = false;
    }
  }, [apiKey.revokedAt, busy]);

  if (apiKey.principalKind === "service" && !users.loaded) {
    return (
      <SettingsPage title={apiKey.name} description={apiKey.id}>
        <Card>
          <SettingsRow
            label={
              users.loading
                ? "Loading API-key principal"
                : "API-key principal unavailable"
            }
            description="Service-user data must load before this key's status can be resolved"
          >
            {users.loading ? (
              <SkeletonPanel className="h-7 w-20" />
            ) : (
              <Button variant="ghost" size="sm" onClick={users.refresh}>
                Retry
              </Button>
            )}
          </SettingsRow>
        </Card>
      </SettingsPage>
    );
  }

  const save = (name: string) => {
    setBusy(true);
    return rename({
      params: { orgId, keyId: apiKey.id },
      payload: { name },
      reactivityKeys: apiSettingsKeys.apiSettings(orgId),
    })
      .then(
        () => {
          toast.success("API key renamed");
          return true;
        },
        (error: unknown) => {
          toast.error(errorMessage(error, "Could not rename API key"));
          return false;
        },
      )
      .finally(() => setBusy(false));
  };

  const confirmRevoke = () => {
    setBusy(true);
    focusAfterRevoke.current = true;
    revoke({
      params: { orgId, keyId: apiKey.id },
      reactivityKeys: apiSettingsKeys.apiSettings(orgId),
    })
      .then(() => toast.success("API key revoked"))
      .catch((error: unknown) => {
        focusAfterRevoke.current = false;
        toast.error(errorMessage(error, "Could not revoke API key"));
      })
      .finally(() => setBusy(false));
  };

  const creatorName = principalName(apiKey.createdByUserId, viewerId);

  return (
    <>
      <SettingsPage
        title={apiKey.name}
        headingRef={headingRef}
        headerFields={
          <EditablePageTitle
            key={apiKey.name}
            value={apiKey.name}
            ariaLabel="API-key name"
            maxLength={255}
            disabled={busy}
            onSave={save}
          />
        }
      >
        <SettingsSection title="Details">
          <Card rows>
            <SettingsRow label="Key ID">
              <CopyValue
                className="w-56"
                size="sm"
                value={apiKey.id}
                label="key ID"
              />
            </SettingsRow>
            <SettingsRow label="Token hint">
              {apiKey.tokenHint === null ? (
                <span className="text-sm text-muted-foreground-2">
                  Not available
                </span>
              ) : (
                <CopyValue
                  className="w-56"
                  size="sm"
                  value={apiKey.tokenHint}
                  label="token hint"
                />
              )}
            </SettingsRow>
            <SettingsRow label="Principal">
              {principal === undefined ? (
                <span className="text-sm text-muted-foreground-1">
                  {apiKey.principalKind === "human"
                    ? principalName(apiKey.principalUserId, viewerId)
                    : `Unknown service user ${apiKey.principalUserId}`}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  render={
                    <Link
                      to="/settings/api/service-user/$serviceUserId"
                      params={{ serviceUserId: principal.id }}
                    >
                      <ProjectIcon icon={principal.icon} />
                      {principal.name}
                    </Link>
                  }
                />
              )}
            </SettingsRow>
            <SettingsRow label="Created by">
              <span className="text-sm text-muted-foreground-1">
                {creatorName}
              </span>
            </SettingsRow>
            <SettingsRow label="Created">
              <span className="text-sm text-muted-foreground-1">
                {formatTimestamp(toDate(apiKey.createdAt))}
              </span>
            </SettingsRow>
            <SettingsRow label="Expires">
              <span className="text-sm text-muted-foreground-1">
                {apiKey.expiresAt === null
                  ? "Never"
                  : formatTimestamp(toDate(apiKey.expiresAt))}
              </span>
            </SettingsRow>
            <SettingsRow label="Status">
              <ApiKeyStatusBadge
                state={state}
                expiresAt={
                  apiKey.expiresAt === null ? null : toDate(apiKey.expiresAt)
                }
              />
              {apiKey.revokedAt !== null && (
                <span className="text-xs text-muted-foreground-2">
                  {formatTimestamp(toDate(apiKey.revokedAt))}
                </span>
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
        {apiKey.privateProjects.length > 0 && (
          <SettingsSection
            title="Private projects"
            description="Reached only while the key's creator is a project member"
          >
            <Card rows>
              {apiKey.privateProjects.map((project) => (
                <SettingsRow
                  key={project.projectId}
                  label={projectName(project.projectId)}
                  description={
                    project.carried
                      ? undefined
                      : apiKey.createdByUserId === viewerId
                        ? "Join the project to reach it"
                        : `Add ${creatorName} to the project to reach it`
                  }
                >
                  {project.carried ? (
                    <Badge color="neutral">
                      <StatusDot color="success" />
                      Reached
                    </Badge>
                  ) : (
                    <Badge color="warning">Not reached</Badge>
                  )}
                </SettingsRow>
              ))}
            </Card>
          </SettingsSection>
        )}
        <SettingsSection title="Danger">
          <Card>
            <SettingsRow
              label="Revoke API key"
              description="Applications using this key lose access immediately"
            >
              {apiKey.revokedAt === null ? (
                <Button
                  size="sm"
                  variant="ghost"
                  intent="danger"
                  disabled={busy}
                  onClick={() => setConfirming(true)}
                >
                  Revoke
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground-1">
                  Revoked {formatTimestamp(toDate(apiKey.revokedAt))}
                </span>
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
      </SettingsPage>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Revoke ${apiKey.name}?`}
        description="Applications using this key lose access immediately and it cannot be restored"
        confirmLabel="Revoke"
        onConfirm={confirmRevoke}
      />
    </>
  );
}
