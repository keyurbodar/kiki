import { useState } from "react";
import { toast } from "sonner";
import {
  awsDefaultAudience,
  type CloudAccess,
  type CloudAccessTarget,
  gcpPermissions,
  vaultDefaultAuthMount,
  vaultLoginCommand,
} from "@/data/api/schemas/cloud-access";
import type { OrgId } from "@/data/api/schemas/ids";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { Card } from "@/primitives/card";
import { SettingsRow, SettingsSection } from "../shared";
import { ProjectCombobox, SetupLoader } from "./cloud-access-page";
import {
  awsCommands,
  awsExports,
  awsLikelyFix,
  azureCommands,
  azureExports,
  azureLikelyFix,
  gcpCommands,
  gcpLikelyFix,
  oidcTrustValues,
  vaultExports,
  vaultSetup,
  vaultVerifyCommands,
  vaultVerifyPrompt,
} from "./commands";
import { useIsOrgAdmin } from "./hooks";
import { CodeBlock, CopyValue, SetupStep } from "./parts";
import { onlyAdminsCanChangeOidc } from "./providers";
import { CheckBadge } from "./status-badges";
import {
  CredentialRow,
  ExportsBlock,
  FailureBlock,
  SetupLayout,
  ShowCommandsButton,
  StatusSection,
  TestRow,
  useSetup,
  ValueRow,
  VerifyButton,
} from "./setup-kit";
import {
  isAudience,
  isAzureId,
  isProjectNumber,
  isRegion,
  isRoleArn,
  isServiceAccountEmail,
  oidcAudienceError,
  oidcTokenPath,
  oidcTokenFileVar,
} from "./validation";
import { oidcTokenFile } from "@/data/api/schemas/cloud-access";

type SetupProps = {
  orgId: OrgId;
  access: CloudAccess;
  target: CloudAccessTarget | undefined;
};

const inputProps = {
  className: "mt-2 max-w-md",
  autoComplete: "off",
  spellCheck: false,
} as const;

function ProjectStep({
  description,
  provider,
  access,
  target,
  setup,
}: {
  description: string;
  provider: CloudAccessTarget["provider"];
  access: CloudAccess;
  target: CloudAccessTarget | undefined;
  setup: ReturnType<typeof useSetup>;
}) {
  return (
    <SetupStep title="Project" description={description}>
      <div className="mt-2">
        {target === undefined ? (
          <ProjectCombobox
            provider={provider}
            access={access}
            target={target}
            projects={setup.projects}
            project={setup.project}
            onProjectId={setup.setProjectId}
          />
        ) : (
          <span className="text-foreground">{setup.projectName}</span>
        )}
      </div>
    </SetupStep>
  );
}

function AwsSetup({ orgId, access, target }: SetupProps) {
  const setup = useSetup(orgId, "aws", target);
  const [roleArnInput, setRoleArn] = useState(target?.aws?.roleArn ?? "");
  const [regionInput, setRegion] = useState(target?.aws?.region ?? "");
  const [audienceInput, setAudience] = useState(
    target?.audience ?? awsDefaultAudience,
  );
  const [showCommands, setShowCommands] = useState(
    target?.lastCheck?.outcome !== "ok",
  );
  const roleArn = roleArnInput.trim();
  const region = regionInput.trim();
  const audience = audienceInput.trim();
  const valid =
    setup.projectId !== null &&
    isRoleArn(roleArn) &&
    (region === "" || isRegion(region)) &&
    isAudience(audience);
  const commands = awsCommands({
    issuer: access.issuer,
    orgId,
    projectId: setup.projectId,
    roleArn,
    audience,
    sharedRole: access.targets.filter(
      (row) =>
        row.provider === "aws" &&
        row.id !== target?.id &&
        row.aws?.roleArn === roleArn,
    ),
  });
  const check = target?.lastCheck ?? null;
  const aws = { roleArn, region: region === "" ? null : region, audience };
  return (
    <SetupLayout
      orgId={orgId}
      provider="aws"
      target={target}
      title={
        setup.projectName === undefined
          ? "Add project"
          : `Set up ${setup.projectName}`
      }
      description={
        target === undefined
          ? "AWS, signs in with an IAM role"
          : `AWS, signs in as ${target.aws?.roleArn ?? "an IAM role"}`
      }
      projectName={setup.projectName}
      removing={setup.removing}
      setRemoving={setup.setRemoving}
      status={
        target === undefined ? null : (
          <StatusSection
            target={target}
            checking={setup.checking}
            onCheck={() => void setup.run(target)}
          >
            <TestRow target={target} />
            {check?.outcome === "failed" ? (
              <FailureBlock
                said="AWS said"
                target={target}
                likelyFix={awsLikelyFix(check.error)}
              />
            ) : null}
            {check?.outcome === "ok" ? (
              <>
                <ValueRow
                  label="Signed in as"
                  value={check.principal ?? target.aws?.roleArn}
                />
                <ExportsBlock
                  caption="Machines export these, the AWS CLI and SDKs read them on their own"
                  text={awsExports(target)}
                  blockKey={`cloud-access-aws-exports-${target.id}`}
                />
                <CredentialRow />
              </>
            ) : null}
          </StatusSection>
        )
      }
      steps={
        <>
          <ProjectStep
            description="Its machines sign in with this role"
            provider="aws"
            access={access}
            target={target}
            setup={setup}
          />
          <SetupStep
            title="Role ARN"
            description="Give the role only the policies the agent needs"
          >
            <Input
              {...inputProps}
              aria-label="Role ARN"
              placeholder="arn:aws:iam::123456789012:role/capy-agent"
              value={roleArnInput}
              onChange={(event) => setRoleArn(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Region"
            description="Optional, machines export it as AWS_REGION"
          >
            <Input
              {...inputProps}
              aria-label="Region"
              placeholder="us-east-1"
              value={regionInput}
              onChange={(event) => setRegion(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Audience"
            description="The client ID on your IAM OIDC provider, keep the default unless you changed it"
          >
            <Input
              {...inputProps}
              aria-label="Audience"
              placeholder={awsDefaultAudience}
              value={audienceInput}
              onChange={(event) => setAudience(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Trust Capy"
            description={`Save the trust policy below as capy-trust.json, then run these once in CloudShell for ${setup.projectName ?? "this project"}`}
          >
            {showCommands ? (
              <div className="mt-2 flex min-w-0 flex-col gap-2">
                <CodeBlock
                  text={commands.trust}
                  language="bash"
                  blockKey="cloud-access-aws-trust"
                />
                <CodeBlock
                  text={commands.trustPolicy}
                  language="json"
                  blockKey="cloud-access-aws-trust-policy"
                />
                <p>
                  If the role already exists, run this instead of create-role,
                  it replaces the role's trust policy, which already trusts
                  every project on this role, so merge in statements for any
                  other principal first
                </p>
                <CodeBlock
                  text={commands.trustExisting}
                  language="bash"
                  blockKey="cloud-access-aws-trust-existing"
                />
              </div>
            ) : (
              <ShowCommandsButton onClick={() => setShowCommands(true)} />
            )}
          </SetupStep>
          <SetupStep
            title="Grant access"
            description="Attach the policies the agent needs to the role, for example read logs, Capy never grants anything itself"
          >
            {showCommands ? (
              <div className="mt-2 min-w-0">
                <CodeBlock
                  text={commands.grant}
                  language="bash"
                  blockKey="cloud-access-aws-grant"
                />
              </div>
            ) : null}
          </SetupStep>
          <SetupStep
            title="Verify"
            description="Assumes the role once with a test token"
          >
            <VerifyButton
              disabled={!valid}
              loading={setup.saving}
              onClick={() =>
                setup.save(
                  (projectId) => ({ projectId, provider: "aws", aws }),
                  { aws },
                )
              }
            />
          </SetupStep>
        </>
      }
    />
  );
}

function GcpSetup({ orgId, access, target }: SetupProps) {
  const setup = useSetup(orgId, "gcp", target);
  const [emailInput, setEmail] = useState(
    target?.gcp?.serviceAccountEmail ?? "",
  );
  const [numberInput, setNumber] = useState(target?.gcp?.projectNumber ?? "");
  const [showCommands, setShowCommands] = useState(
    target?.lastCheck?.outcome !== "ok",
  );
  const [showAll, setShowAll] = useState(false);
  const serviceAccountEmail = emailInput.trim();
  const projectNumber = numberInput.trim();
  const valid =
    setup.projectId !== null &&
    isServiceAccountEmail(serviceAccountEmail) &&
    isProjectNumber(projectNumber);
  const check = target?.lastCheck ?? null;
  const granted = new Set(check?.grantedPermissions ?? []);
  const commands = gcpCommands({
    issuer: access.issuer,
    orgId,
    projectId: setup.projectId,
    serviceAccountEmail,
    projectNumber,
  });
  const gcp = { projectNumber, serviceAccountEmail };
  return (
    <SetupLayout
      orgId={orgId}
      provider="gcp"
      target={target}
      title={
        setup.projectName === undefined
          ? "Add project"
          : `Set up ${setup.projectName}`
      }
      description={
        target === undefined
          ? "Google Cloud, signs in with Workload Identity Federation"
          : `Google Cloud, signs in as ${target.gcp?.serviceAccountEmail ?? "a service account"}`
      }
      projectName={setup.projectName}
      removing={setup.removing}
      setRemoving={setup.setRemoving}
      status={
        target === undefined ? null : (
          <StatusSection
            target={target}
            checking={setup.checking}
            onCheck={() => void setup.run(target)}
          >
            <TestRow target={target} />
            {check?.outcome === "failed" ? (
              <FailureBlock
                said="Google said"
                target={target}
                likelyFix={gcpLikelyFix(check.error, setup.projectName)}
              />
            ) : null}
            {check?.outcome === "ok" ? (
              <>
                <ValueRow
                  label="Signed in as"
                  value={check.principal ?? target.gcp?.serviceAccountEmail}
                />
                <SettingsRow label="Can" wrapValue>
                  {check.grantedPermissions === null ? (
                    <span className="text-sm font-normal text-muted-foreground-2">
                      Google could not be asked
                    </span>
                  ) : (
                    <span className="flex min-w-0 flex-col items-end gap-1.5">
                      {granted.size === 0 ? null : (
                        <span className="flex flex-wrap justify-end gap-1">
                          {gcpPermissions
                            .filter((row) => granted.has(row.permission))
                            .map((row) => (
                              <Badge
                                key={row.permission}
                                color="neutral"
                                size="sm"
                              >
                                {row.label}
                              </Badge>
                            ))}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground-2 tabular-nums">
                        {`${granted.size} of ${gcpPermissions.length} common permissions ·`}
                        <Button
                          variant="link"
                          size="auto-xs"
                          aria-expanded={showAll}
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll ? "Hide" : "Show all"}
                        </Button>
                      </span>
                    </span>
                  )}
                </SettingsRow>
                {showAll
                  ? gcpPermissions.map((row) => (
                      <div
                        key={row.permission}
                        className="flex min-h-10 items-center justify-between gap-6 px-4 py-2"
                      >
                        <span
                          className={
                            granted.has(row.permission)
                              ? "text-sm font-normal text-foreground"
                              : "text-sm font-normal text-muted-foreground-2"
                          }
                        >
                          {row.label}
                        </span>
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="truncate text-xs text-muted-foreground-2">
                            {row.permission}
                          </span>
                          {granted.has(row.permission) ? (
                            <Badge color="success" size="sm">
                              Granted
                            </Badge>
                          ) : (
                            <Badge color="neutral" size="sm">
                              Not granted
                            </Badge>
                          )}
                        </span>
                      </div>
                    ))
                  : null}
                <CredentialRow />
              </>
            ) : null}
          </StatusSection>
        )
      }
      steps={
        <>
          <ProjectStep
            description="Its machines sign in with this identity"
            provider="gcp"
            access={access}
            target={target}
            setup={setup}
          />
          <SetupStep
            title="Service account"
            description="Grant it only the roles the agent needs"
          >
            <Input
              {...inputProps}
              aria-label="Service account"
              placeholder="name@project.iam.gserviceaccount.com"
              value={emailInput}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Project number"
            description="From the Google Cloud console dashboard"
          >
            <Input
              className="mt-2 max-w-md"
              autoComplete="off"
              inputMode="numeric"
              aria-label="Project number"
              placeholder="123456789012"
              value={numberInput}
              onChange={(event) => setNumber(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Trust Capy"
            description={
              valid
                ? `Run once in Cloud Shell, filled in for ${setup.projectName ?? "this project"}`
                : "Commands appear once the steps above are filled"
            }
          >
            {valid ? (
              showCommands ? (
                <div className="mt-2 min-w-0">
                  <CodeBlock
                    text={commands.trust}
                    language="bash"
                    blockKey="cloud-access-gcp-trust"
                  />
                </div>
              ) : (
                <ShowCommandsButton onClick={() => setShowCommands(true)} />
              )
            ) : null}
          </SetupStep>
          <SetupStep
            title="Grant access"
            description="Give the service account the roles the agent needs, for example read logs, Capy never grants anything itself"
          >
            {valid && showCommands ? (
              <div className="mt-2 min-w-0">
                <CodeBlock
                  text={commands.grant}
                  language="bash"
                  blockKey="cloud-access-gcp-grant"
                />
              </div>
            ) : null}
          </SetupStep>
          <SetupStep
            title="Verify"
            description="Signs in once with a test token and lists what it can do"
          >
            <VerifyButton
              disabled={!valid}
              loading={setup.saving}
              onClick={() =>
                setup.save(
                  (projectId) => ({ projectId, provider: "gcp", gcp }),
                  { gcp },
                )
              }
            />
          </SetupStep>
        </>
      }
    />
  );
}

function AzureSetup({ orgId, access, target }: SetupProps) {
  const setup = useSetup(orgId, "azure", target);
  const [tenantInput, setTenant] = useState(target?.azure?.tenantId ?? "");
  const [clientInput, setClient] = useState(target?.azure?.clientId ?? "");
  const [showCommands, setShowCommands] = useState(
    target?.lastCheck?.outcome !== "ok",
  );
  const tenantId = tenantInput.trim().toLowerCase();
  const clientId = clientInput.trim().toLowerCase();
  const valid =
    setup.projectId !== null && isAzureId(tenantId) && isAzureId(clientId);
  const check = target?.lastCheck ?? null;
  const commands = azureCommands({
    issuer: access.issuer,
    orgId,
    projectId: setup.projectId,
    clientId,
  });
  const azure = { tenantId, clientId };
  return (
    <SetupLayout
      orgId={orgId}
      provider="azure"
      target={target}
      title={
        setup.projectName === undefined
          ? "Add project"
          : `Set up ${setup.projectName}`
      }
      description={
        target === undefined
          ? "Azure, signs in with workload identity federation"
          : `Azure, signs in as ${target.azure?.clientId ?? "an app registration"}`
      }
      projectName={setup.projectName}
      removing={setup.removing}
      setRemoving={setup.setRemoving}
      status={
        target === undefined ? null : (
          <StatusSection
            target={target}
            checking={setup.checking}
            onCheck={() => void setup.run(target)}
          >
            <TestRow target={target} />
            {check?.outcome === "failed" ? (
              <FailureBlock
                said="Entra said"
                target={target}
                likelyFix={azureLikelyFix(check.error)}
              />
            ) : null}
            {check?.outcome === "ok" ? (
              <>
                <ValueRow
                  label="Signed in as"
                  value={check.principal ?? target.azure?.clientId}
                />
                <ExportsBlock
                  caption="Machines export these, Azure SDKs read them through DefaultAzureCredential"
                  text={azureExports(target)}
                  blockKey={`cloud-access-azure-exports-${target.id}`}
                />
                <CredentialRow />
              </>
            ) : null}
          </StatusSection>
        )
      }
      steps={
        <>
          <ProjectStep
            description="Its machines sign in as this app registration"
            provider="azure"
            access={access}
            target={target}
            setup={setup}
          />
          <SetupStep
            title="Tenant ID"
            description="The directory (tenant) ID from Microsoft Entra"
          >
            <Input
              {...inputProps}
              aria-label="Tenant ID"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={tenantInput}
              onChange={(event) => setTenant(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Client ID"
            description="The app registration's application (client) ID"
          >
            <Input
              {...inputProps}
              aria-label="Client ID"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={clientInput}
              onChange={(event) => setClient(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Trust Capy"
            description={`Run once in Cloud Shell to add a federated credential for ${setup.projectName ?? "this project"}`}
          >
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-foreground">Subject</span>
              <CopyValue value={commands.subject} label="subject" />
            </div>
            {showCommands ? (
              <div className="mt-2 flex min-w-0 flex-col gap-2">
                <CodeBlock
                  text={commands.trust}
                  language="bash"
                  blockKey="cloud-access-azure-trust"
                />
                <p>
                  If the credential already exists, run this instead, it
                  replaces its settings
                </p>
                <CodeBlock
                  text={commands.trustExisting}
                  language="bash"
                  blockKey="cloud-access-azure-trust-existing"
                />
                <p>
                  Using a managed identity, add a federated credential with the
                  issuer, this subject, and the audience
                  api://AzureADTokenExchange
                </p>
              </div>
            ) : (
              <ShowCommandsButton onClick={() => setShowCommands(true)} />
            )}
          </SetupStep>
          <SetupStep
            title="Grant access"
            description="Assign the app the roles the agent needs, for example Reader, Capy never grants anything itself"
          >
            {showCommands ? (
              <div className="mt-2 min-w-0">
                <CodeBlock
                  text={commands.grant}
                  language="bash"
                  blockKey="cloud-access-azure-grant"
                />
              </div>
            ) : null}
          </SetupStep>
          <SetupStep
            title="Verify"
            description="Signs in once with a test token for this project's subject"
          >
            <VerifyButton
              disabled={!valid}
              loading={setup.saving}
              onClick={() =>
                setup.save(
                  (projectId) => ({ projectId, provider: "azure", azure }),
                  { azure },
                )
              }
            />
          </SetupStep>
        </>
      }
    />
  );
}

function VaultSetup({ orgId, access, target }: SetupProps) {
  const setup = useSetup(orgId, "vault", target);
  const [addressInput, setAddress] = useState(target?.vault?.address ?? "");
  const [roleInput, setRole] = useState<string | null>(
    target?.vault?.role ?? null,
  );
  const [mountInput, setMount] = useState(
    target?.vault?.authMount ?? vaultDefaultAuthMount,
  );
  const [namespaceInput, setNamespace] = useState(
    target?.vault?.namespace ?? "",
  );
  const [audienceInput, setAudience] = useState<string | null>(
    target === undefined || target.audience === target.vault?.address
      ? null
      : target.audience,
  );
  const [showCommands, setShowCommands] = useState(target === undefined);
  const vault = vaultSetup({
    issuer: access.issuer,
    orgId,
    projectId: setup.projectId,
    address: addressInput,
    role: roleInput,
    authMount: mountInput,
    namespace: namespaceInput,
    audience: audienceInput,
  });
  const payload = {
    address: vault.address,
    role: vault.role,
    authMount: vault.authMount,
    namespace: vault.namespace === "" ? null : vault.namespace,
    audience: vault.audience,
  };
  const verifyFromThread = () => {
    if (setup.project === undefined) return;
    void setup.navigate({ to: "/new", search: { prompt: vaultVerifyPrompt } });
  };
  return (
    <SetupLayout
      orgId={orgId}
      provider="vault"
      target={target}
      title={
        setup.projectName === undefined
          ? "Add project"
          : `Set up ${setup.projectName}`
      }
      description={
        target?.vault == null
          ? "Vault, logs in with JWT auth"
          : `Vault, logs in as ${target.vault.role} on ${target.vault.address}`
      }
      projectName={setup.projectName}
      removing={setup.removing}
      setRemoving={setup.setRemoving}
      status={
        target === undefined ? null : (
          <VaultStatus target={target} />
        )
      }
      steps={
        <>
          <ProjectStep
            description="Its machines log in to Vault with this role"
            provider="vault"
            access={access}
            target={target}
            setup={setup}
          />
          <SetupStep
            title="Vault address"
            description="Machines reach it directly, or through your tailnet"
          >
            <Input
              {...inputProps}
              aria-label="Vault address"
              placeholder="https://vault.example.com"
              value={addressInput}
              onChange={(event) => setAddress(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Role"
            description="The JWT auth role machines log in with, one per project so another project's setup never replaces it"
          >
            <Input
              {...inputProps}
              aria-label="Role"
              placeholder="capy-<project id>"
              value={roleInput ?? vault.defaultRole}
              onChange={(event) => setRole(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Auth mount"
            description="Where the JWT auth method is enabled, use a mount only Capy uses, its config trusts Capy's issuer alone"
          >
            <Input
              {...inputProps}
              aria-label="Auth mount"
              placeholder={vaultDefaultAuthMount}
              value={mountInput}
              onChange={(event) => setMount(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep title="Namespace" description="Optional, HCP Vault uses admin">
            <Input
              {...inputProps}
              aria-label="Namespace"
              placeholder="admin"
              value={namespaceInput}
              onChange={(event) => setNamespace(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Audience"
            description="Goes in the role's bound_audiences, the Vault address by default"
          >
            <Input
              {...inputProps}
              aria-label="Audience"
              placeholder="https://vault.example.com"
              value={audienceInput ?? addressInput}
              onChange={(event) => setAudience(event.currentTarget.value)}
            />
          </SetupStep>
          <SetupStep
            title="Trust Capy"
            description={`Run once with a Vault admin token, filled in for ${setup.projectName ?? "this project"}`}
          >
            {showCommands ? (
              <div className="mt-2 min-w-0">
                <CodeBlock
                  text={vault.trust}
                  language="bash"
                  blockKey="cloud-access-vault-trust"
                />
              </div>
            ) : (
              <ShowCommandsButton onClick={() => setShowCommands(true)} />
            )}
          </SetupStep>
          <SetupStep
            title="Grant access"
            description={`Write the ${vault.policy} policy with the paths the agent needs, Capy never grants anything itself`}
          >
            {showCommands ? (
              <div className="mt-2 min-w-0">
                <CodeBlock
                  text={vault.grant}
                  language="bash"
                  blockKey="cloud-access-vault-grant"
                />
              </div>
            ) : null}
          </SetupStep>
          <SetupStep
            title="Verify"
            description="Vault is checked from a thread in this project, Capy's servers never call your Vault"
          >
            <div className="mt-2 min-w-0">
              <CodeBlock
                text={vaultVerifyCommands}
                language="bash"
                blockKey="cloud-access-vault-verify"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <VerifyButton
                className=""
                disabled={!vault.valid}
                loading={setup.saving}
                onClick={() =>
                  setup.save(
                    (projectId) => ({
                      projectId,
                      provider: "vault",
                      vault: payload,
                    }),
                    { vault: payload },
                    {
                      created: () =>
                        void toast.success("Saved, verify it from a thread"),
                      updated: () => void toast.success("Saved"),
                    },
                  )
                }
              >
                Save
              </VerifyButton>
              {target === undefined ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={setup.project === undefined}
                  onClick={verifyFromThread}
                >
                  Verify from a thread
                </Button>
              )}
            </div>
          </SetupStep>
        </>
      }
    />
  );
}

function VaultStatus({ target }: { target: CloudAccessTarget }) {
  return (
    <SettingsSection title="Status">
      <Card rows>
        <SettingsRow
          label="Test sign-in"
          description="Run from a thread in this project, Capy's servers never call your Vault"
        >
          <CheckBadge provider="vault" check={target.lastCheck} />
        </SettingsRow>
      <ExportsBlock
        caption="Machines export these, the Vault CLI reads VAULT_ADDR and VAULT_NAMESPACE"
        text={vaultExports(target)}
        blockKey={`cloud-access-vault-exports-${target.id}`}
      />
      <ExportsBlock
        caption="The agent logs in with this line, the token lasts up to 15 minutes"
        text={vaultLoginCommand}
        blockKey={`cloud-access-vault-login-${target.id}`}
        />
      </Card>
    </SettingsSection>
  );
}

function OidcSetup({ orgId, access, target }: SetupProps) {
  const setup = useSetup(orgId, "oidc", target);
  const isAdmin = useIsOrgAdmin(orgId);
  const [audienceInput, setAudience] = useState(target?.audience ?? "");
  const [showValues, setShowValues] = useState(
    target?.lastCheck?.outcome !== "ok",
  );
  const audience = audienceInput.trim();
  const error =
    audience === "" || audience === target?.audience
      ? undefined
      : oidcAudienceError(audience);
  const valid = setup.projectId !== null && audience !== "" && error === undefined;
  const tokenLocation =
    target === undefined
      ? access.targets.some(
          (row) =>
            row.projectId === setup.projectId && row.tokenFile === oidcTokenFile,
        )
        ? "a file in $CAPY_OIDC_TOKEN_DIR named after the audience"
        : oidcTokenFileVar
      : oidcTokenPath(target);
  const check = target?.lastCheck ?? null;
  return (
    <SetupLayout
      orgId={orgId}
      provider="oidc"
      target={target}
      title={
        setup.projectName === undefined
          ? "Add target"
          : `Set up ${setup.projectName}`
      }
      description={
        target === undefined
          ? "Generic OIDC, a token for the audience you choose"
          : `Generic OIDC, a token for ${target.audience}`
      }
      projectName={setup.projectName}
      removing={setup.removing}
      setRemoving={setup.setRemoving}
      status={
        target === undefined ? null : (
          <StatusSection
            target={target}
            checking={setup.checking}
            onCheck={() => void setup.run(target)}
          >
            <TestRow label="Test token" target={target} />
            {check?.outcome === "failed" ? (
              <FailureBlock
                said="Capy said"
                target={target}
                likelyFix="Capy could not sign the token, check again in a few minutes"
              />
            ) : null}
            {check?.outcome === "ok" ? (
              <>
                <ValueRow
                  label="Issued for"
                  value={check.principal ?? target.subject}
                />
                <ValueRow label="Audience" value={target.audience} />
                <ValueRow label="Token file" value={oidcTokenPath(target)} />
                <CredentialRow />
              </>
            ) : null}
          </StatusSection>
        )
      }
      steps={
        <>
          <ProjectStep
            description="Its machines get a token for this audience"
            provider="oidc"
            access={access}
            target={target}
            setup={setup}
          />
          <SetupStep
            title="Audience"
            description="The audience your vendor expects, unique in this organization"
          >
            <Input
              {...inputProps}
              aria-label="Audience"
              aria-invalid={error !== undefined || undefined}
              placeholder="vendor:team:example"
              value={audienceInput}
              onChange={(event) => setAudience(event.currentTarget.value)}
            />
            {error === undefined ? null : (
              <p className="mt-1 text-xs font-normal text-destructive">
                {error}
              </p>
            )}
          </SetupStep>
          <SetupStep
            title="Trust Capy"
            description={
              valid
                ? "Add a custom OIDC provider in your vendor with these values"
                : "Values appear once the steps above are filled"
            }
          >
            {valid ? (
              showValues ? (
                <div className="mt-2 min-w-0">
                  <CodeBlock
                    text={oidcTrustValues({
                      issuer: access.issuer,
                      audience,
                      subject: target?.subject,
                      orgId,
                      projectId: setup.projectId,
                    })}
                    language="yaml"
                    blockKey="cloud-access-oidc-trust"
                  />
                </div>
              ) : (
                <ShowCommandsButton
                  label="Show values"
                  onClick={() => setShowValues(true)}
                />
              )
            ) : null}
          </SetupStep>
          <SetupStep
            title="Grant access"
            description={`Map the subject to a role in your vendor, the agent reads the token from ${tokenLocation}`}
          />
          <SetupStep
            title="Verify"
            description="Issues a test token for this audience, your vendor checks it on first use"
          >
            {isAdmin ? (
              <VerifyButton
                disabled={!valid}
                loading={setup.saving}
                onClick={() =>
                  setup.save(
                    (projectId) => ({ projectId, provider: "oidc", audience }),
                    { audience },
                  )
                }
              />
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="mt-2 inline-flex">
                      <VerifyButton className="" disabled loading={false} />
                    </span>
                  }
                />
                <TooltipContent side="top">{onlyAdminsCanChangeOidc}</TooltipContent>
              </Tooltip>
            )}
          </SetupStep>
        </>
      }
    />
  );
}

const setupComponents = {
  aws: AwsSetup,
  gcp: GcpSetup,
  azure: AzureSetup,
  vault: VaultSetup,
  oidc: OidcSetup,
} as const;

export function CloudSetupPage({
  provider,
  targetId,
}: {
  provider: keyof typeof setupComponents;
  targetId?: string;
}) {
  const Setup = setupComponents[provider];
  return (
    <SetupLoader provider={provider} targetId={targetId}>
      {(orgId, access, target) => (
        <Setup key={target?.id} orgId={orgId} access={access} target={target} />
      )}
    </SetupLoader>
  );
}
