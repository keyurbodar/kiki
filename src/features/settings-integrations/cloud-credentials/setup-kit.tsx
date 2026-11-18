import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import type {
  CloudAccessCheck,
  CloudAccessTarget,
  CloudProvider,
  CreateCloudAccessTargetRequest,
  UpdateCloudAccessTargetRequest,
} from "@/data/api/schemas/cloud-access";
import type { OrgId } from "@/data/api/schemas/ids";
import { ProjectId } from "@/data/api/schemas/ids";
import {
  cloudAccessKeys,
  createCloudAccessTargetAtom,
  updateCloudAccessTargetAtom,
} from "@/data/atoms/cloud-credentials";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { toast } from "@/primitives/toaster";
import { SettingsPage, SettingsRow, SettingsSection } from "../shared";
import { RemoveDialog, RemoveSection } from "./cloud-access-page";
import { formatDateTime } from "./format";
import {
  errorMessage,
  toastCheckResult,
  useCheckTarget,
  useProjects,
} from "./hooks";
import { CodeBlock, setupListClass } from "./parts";
import { providerRoutes, providers } from "./providers";
import { CheckBadge } from "./status-badges";

export function useSetup(
  orgId: OrgId,
  provider: CloudProvider,
  target: CloudAccessTarget | undefined,
) {
  const navigate = useNavigate();
  const projects = useProjects(orgId);
  const create = useAtomSet(createCloudAccessTargetAtom, { mode: "promise" });
  const update = useAtomSet(updateCloudAccessTargetAtom, { mode: "promise" });
  const { checking, run } = useCheckTarget(orgId);
  const [projectId, setProjectId] = useState<string | null>(
    target?.projectId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const project = projects.find((row) => row.id === projectId);
  const projectName =
    project?.name ?? (target === undefined ? undefined : "Unknown project");
  const reactivityKeys = cloudAccessKeys.cloudAccess(orgId);
  const routes = providerRoutes[provider];

  const save = (
    createPayload: (projectId: ProjectId) => CreateCloudAccessTargetRequest,
    updatePayload: UpdateCloudAccessTargetRequest,
    after: {
      created: (target: CloudAccessTarget) => void;
      updated: (target: CloudAccessTarget) => void;
    } = {
      created: toastCheckResult,
      updated: (updated) => void run(updated),
    },
  ) => {
    if (projectId === null) return;
    setSaving(true);
    (target === undefined
      ? create({
          params: { orgId },
          payload: createPayload(ProjectId.make(projectId)),
          reactivityKeys,
        }).then((created) => {
          after.created(created);
          void navigate({
            to: routes.target,
            params: { targetId: created.id },
          });
        })
      : update({
          params: { orgId, targetId: target.id },
          payload: updatePayload,
          reactivityKeys,
        }).then(after.updated)
    )
      .catch((error: unknown) => {
        toast.error(errorMessage(error, "Could not save the setup"));
      })
      .finally(() => setSaving(false));
  };

  return {
    navigate,
    projects,
    project,
    projectId,
    setProjectId,
    projectName,
    checking,
    run,
    saving,
    save,
    removing,
    setRemoving,
  };
}

export function SetupLayout({
  orgId,
  provider,
  target,
  title,
  description,
  status,
  steps,
  projectName,
  removing,
  setRemoving,
}: {
  orgId: OrgId;
  provider: CloudProvider;
  target: CloudAccessTarget | undefined;
  title: string;
  description: string;
  status: ReactNode;
  steps: ReactNode;
  projectName: string | undefined;
  removing: boolean;
  setRemoving: (removing: boolean) => void;
}) {
  const navigate = useNavigate();
  const meta = providers[provider];
  return (
    <SettingsPage
      title={title}
      description={description}
      icon={meta.icon}
      iconTile={meta.iconTile}
    >
      {target === undefined ? null : status}
      <SettingsSection
        title="Setup"
        action={
          <Button
            variant="link"
            size="auto-sm"
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
      >
        <Card className="p-4">
          <ol className={setupListClass}>{steps}</ol>
        </Card>
      </SettingsSection>
      {target === undefined ? null : (
        <RemoveSection
          orgId={orgId}
          provider={provider}
          onRemove={() => setRemoving(true)}
        />
      )}
      {removing && target !== undefined ? (
        <RemoveDialog
          orgId={orgId}
          target={target}
          projectName={projectName ?? "this project"}
          onClose={() => setRemoving(false)}
          onRemoved={() => void navigate({ to: providerRoutes[provider].list })}
        />
      ) : null}
    </SettingsPage>
  );
}

export function StatusSection({
  target,
  checking,
  onCheck,
  children,
}: {
  target: CloudAccessTarget;
  checking: string | null;
  onCheck: () => void;
  children: ReactNode;
}) {
  return (
    <SettingsSection
      title="Status"
      action={
        <Button
          variant="ghost"
          size="sm"
          disabled={checking === target.id}
          aria-busy={checking === target.id || undefined}
          onClick={onCheck}
        >
          Check now
        </Button>
      }
    >
      <Card rows>{children}</Card>
    </SettingsSection>
  );
}

export const checkDescription = (check: CloudAccessCheck | null) =>
  check === null
    ? "Not run yet"
    : formatDateTime(new Date(check.at.epochMilliseconds));

export function TestRow({
  label = "Test sign-in",
  target,
}: {
  label?: string;
  target: CloudAccessTarget;
}) {
  return (
    <SettingsRow label={label} description={checkDescription(target.lastCheck)}>
      <CheckBadge provider={target.provider} check={target.lastCheck} />
    </SettingsRow>
  );
}

export function FailureBlock({
  said,
  target,
  likelyFix,
}: {
  said: string;
  target: CloudAccessTarget;
  likelyFix: string | undefined;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 p-4">
      <span className="text-sm font-normal text-muted-foreground-1">
        {said}
      </span>
      <CodeBlock
        text={target.lastCheck?.error ?? "No error returned"}
        language="text"
        blockKey={`cloud-access-error-${target.id}`}
      />
      {likelyFix === undefined ? null : (
        <span className="text-sm font-normal text-muted-foreground-1">
          {`Likely fix: ${likelyFix}`}
        </span>
      )}
    </div>
  );
}

export function ValueRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <SettingsRow label={label} wrapValue>
      <span className="min-w-0 text-right text-xs break-all text-foreground">
        {value}
      </span>
    </SettingsRow>
  );
}

export function CredentialRow() {
  return (
    <SettingsRow label="Credential" wrapValue>
      <span className="text-sm font-normal text-foreground">
        Expires after 15 minutes, refreshed by Capy
      </span>
    </SettingsRow>
  );
}

export function ExportsBlock({
  caption,
  text,
  blockKey,
}: {
  caption: string;
  text: string;
  blockKey: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 p-4">
      <span className="text-sm font-normal text-muted-foreground-1">
        {caption}
      </span>
      <CodeBlock text={text} language="bash" blockKey={blockKey} />
    </div>
  );
}

export function ShowCommandsButton({
  label = "Show commands",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" className="mt-1 -ml-2" onClick={onClick}>
      {label}
    </Button>
  );
}

export function VerifyButton({
  disabled,
  loading,
  onClick,
  children = "Verify",
  className = "mt-2",
}: {
  disabled: boolean;
  loading: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Button
      intent="accent"
      size="sm"
      className={className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
