import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ApiKey, ServiceUser } from "@/data/api/schemas/api-keys";
import type { OrgId } from "@/data/api/schemas/ids";
import { apiKeysAtom, serviceUsersAtom } from "@/data/atoms/api-keys";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  SettingsLoadFailedRow,
  SettingsLoadingCard,
  SettingsPage,
  SettingsRowLink,
  SettingsSection,
  useActiveOrgId,
} from "../shared";
import { CreateApiKeyDialog, CreateServiceUserDialog } from "./api-dialogs";
import {
  apiKeyState,
  formatTimestamp,
  pluralize,
  projectScope,
  roleLabels,
  sortApiKeys,
  sortServiceUsers,
  toDate,
  unreachedProjects,
} from "./api-state";
import { ApiKeyIcon, PlusIcon, ProjectIcon } from "./icons";
import { ApiKeyStatusBadge, SearchCardListHeader } from "./parts";
import {
  principalName,
  useCurrentUserId,
  useOrgAdmin,
  useQueryState,
} from "./use-api-context";

export function ApiSettingsPage() {
  const orgId = useActiveOrgId();
  if (orgId === undefined) {
    return (
      <SettingsPage
        title="API"
        description="Service users and keys for programmatic access"
      >
        <SettingsSection
          id="service-users"
          title="Service users"
          description="Non-human identities for automation and integrations"
        >
          <SettingsLoadingCard />
        </SettingsSection>
        <SettingsSection
          id="public-api-keys"
          title="API keys"
          description="Credentials that act as you or a service user"
        >
          <SettingsLoadingCard />
        </SettingsSection>
      </SettingsPage>
    );
  }
  return <ApiSettingsContent orgId={orgId} />;
}

function ApiSettingsContent({ orgId }: { orgId: OrgId }) {
  const navigate = useNavigate();
  const { isAdmin } = useOrgAdmin();
  const viewerId = useCurrentUserId();
  const users = useQueryState(serviceUsersAtom(orgId));
  const keys = useQueryState(apiKeysAtom(orgId));
  const [creatingServiceUser, setCreatingServiceUser] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [query, setQuery] = useState("");
  const [showRevoked, setShowRevoked] = useState(false);

  const usersById = new Map<string, ServiceUser>(
    users.rows.map((user) => [user.id, user]),
  );
  const sortedUsers = sortServiceUsers(users.rows);
  const sortedKeys = sortApiKeys(keys.rows, usersById);
  const revokedCount = sortedKeys.filter(
    (key) => key.revokedAt !== null,
  ).length;
  const visibleKeys = showRevoked
    ? sortedKeys
    : sortedKeys.filter((key) => key.revokedAt === null);
  const matchingKeys = visibleKeys.filter((key) =>
    key.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const keysLoading = keys.loading || users.loading;
  const keysFailed = keys.failed || users.failed;

  const principalLabel = (key: ApiKey) =>
    key.principalKind === "human"
      ? principalName(key.principalUserId, viewerId)
      : (usersById.get(key.principalUserId)?.name ??
        `Unknown service user ${key.principalUserId}`);

  return (
    <>
      <SettingsPage
        title="API"
        description="Service users and keys for programmatic access"
      >
        <SettingsSection
          id="service-users"
          title="Service users"
          description="Non-human identities for automation and integrations"
        >
          {users.loading ? (
            <SettingsLoadingCard />
          ) : users.failed ? (
            <Card>
              <SettingsLoadFailedRow
                label="Could not load service users"
                onRetry={users.refresh}
              />
            </Card>
          ) : (
            <Card rows>
              <SearchCardListHeader
                label={pluralize(sortedUsers.length, "service user")}
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Create service user"
                    title="Create service user"
                    onClick={() => setCreatingServiceUser(true)}
                  >
                    <PlusIcon />
                  </Button>
                }
              />
              {sortedUsers.map((user) => (
                <SettingsRowLink
                  key={user.id}
                  to="/settings/api/service-user/$serviceUserId"
                  params={{ serviceUserId: user.id }}
                  label={user.name}
                  description={
                    user.description ??
                    `${roleLabels[user.role]} on ${projectScope(user)}`
                  }
                  descriptionTone="strong"
                  icon={<ProjectIcon icon={user.icon} />}
                >
                  {user.disabledAt !== null && (
                    <Badge color="neutral">Disabled</Badge>
                  )}
                </SettingsRowLink>
              ))}
            </Card>
          )}
        </SettingsSection>
        <SettingsSection
          id="public-api-keys"
          title="API keys"
          description="Credentials that act as you or a service user"
        >
          <div>
            {keysLoading ? (
              <SettingsLoadingCard />
            ) : keysFailed ? (
              <Card>
                <SettingsLoadFailedRow
                  label="Could not load API keys"
                  onRetry={() => {
                    users.refresh();
                    keys.refresh();
                  }}
                />
              </Card>
            ) : (
              <Card rows>
                <SearchCardListHeader
                  label={pluralize(visibleKeys.length, "API key")}
                  search={
                    visibleKeys.length < 2 && query === ""
                      ? undefined
                      : {
                          value: query,
                          onChange: setQuery,
                          placeholder: "Search API keys",
                        }
                  }
                  tools={
                    revokedCount === 0 ? undefined : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRevoked((shown) => !shown)}
                      >
                        {showRevoked
                          ? "Hide revoked"
                          : `Show ${revokedCount} revoked`}
                      </Button>
                    )
                  }
                  action={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Create API key"
                      title="Create API key"
                      disabled={!users.loaded}
                      onClick={() => setCreatingKey(true)}
                    >
                      <PlusIcon />
                    </Button>
                  }
                />
                {matchingKeys.length === 0 && visibleKeys.length > 0 && (
                  <div className="p-4 text-sm text-muted-foreground-2">
                    No API keys match
                  </div>
                )}
                {matchingKeys.map((key) => {
                  const unreached = unreachedProjects(key).length;
                  return (
                    <SettingsRowLink
                      key={key.id}
                      to="/settings/api/key/$keyId"
                      params={{ keyId: key.id }}
                      label={key.name}
                      description={`${key.tokenHint ?? "Imported key"} for ${principalLabel(key)}, created ${formatTimestamp(toDate(key.createdAt))}`}
                      descriptionTone="strong"
                      icon={<ApiKeyIcon />}
                    >
                      {unreached > 0 && (
                        <Badge color="warning">
                          {pluralize(unreached, "private project")} not reached
                        </Badge>
                      )}
                      <ApiKeyStatusBadge
                        state={apiKeyState(key, usersById)}
                        expiresAt={
                          key.expiresAt === null ? null : toDate(key.expiresAt)
                        }
                      />
                    </SettingsRowLink>
                  );
                })}
              </Card>
            )}
          </div>
        </SettingsSection>
      </SettingsPage>
      <CreateServiceUserDialog
        open={creatingServiceUser}
        onOpenChange={setCreatingServiceUser}
        orgId={orgId}
        canCreateAdmin={isAdmin}
        onCreated={(serviceUserId) =>
          void navigate({
            to: "/settings/api/service-user/$serviceUserId",
            params: { serviceUserId },
          })
        }
      />
      <CreateApiKeyDialog
        open={creatingKey}
        onOpenChange={setCreatingKey}
        orgId={orgId}
        serviceUsers={sortedUsers}
      />
    </>
  );
}
