import {
  awsTokenFile,
  azureAudience,
  azureTokenFile,
  type CloudAccessTarget,
  gcpPoolId,
  gcpProviderId,
  vaultDefaultAuthMount,
  vaultLoginCommand,
} from "@/data/api/schemas/cloud-access";
import {
  isAudience,
  isAzureId,
  isRoleArn,
  isVaultAddress,
  isVaultPath,
  isVaultRole,
  shellQuote,
  subjectFor,
} from "./validation";

const lines = (...parts: ReadonlyArray<string>) => parts.join("\n");
const issuerHost = (issuer: string) => issuer.replace(/^https:\/\//, "");

export const awsTrustPolicy = (input: {
  issuer: string;
  accountId: string;
  audiences: ReadonlyArray<string>;
  orgId: string;
  projectIds: ReadonlyArray<string>;
}) => {
  const host = issuerHost(input.issuer);
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Federated: `arn:aws:iam::${input.accountId}:oidc-provider/${host}`,
          },
          Action: "sts:AssumeRoleWithWebIdentity",
          Condition: {
            StringEquals: { [`${host}:aud`]: [...new Set(input.audiences)] },
            StringLike: {
              [`${host}:sub`]: [...new Set(input.projectIds)].map(
                (projectId) =>
                  `org/${input.orgId}/project/${projectId}/thread/*`,
              ),
            },
          },
        },
      ],
    },
    null,
    2,
  );
};

export const awsCommands = (input: {
  issuer: string;
  orgId: string | undefined;
  projectId: string | null;
  roleArn: string;
  audience: string;
  sharedRole: ReadonlyArray<Pick<CloudAccessTarget, "audience" | "projectId">>;
}) => {
  const validArn = isRoleArn(input.roleArn);
  const rolePath = validArn
    ? input.roleArn.split(":role/")[1]?.split("/")
    : undefined;
  const roleName = rolePath?.at(-1) ?? "capy-agent";
  const path =
    rolePath === undefined || rolePath.length < 2
      ? undefined
      : `/${rolePath.slice(0, -1).join("/")}/`;
  const audience = isAudience(input.audience) ? input.audience : "<audience>";
  const accountId = validArn
    ? (input.roleArn.split(":")[4] ?? "<account>")
    : "<account>";
  return {
    trust: lines(
      `ISSUER=${shellQuote(input.issuer)}`,
      `AUDIENCE=${shellQuote(audience)}`,
      "aws iam add-client-id-to-open-id-connect-provider \\",
      `  --open-id-connect-provider-arn ${shellQuote(`arn:aws:iam::${accountId}:oidc-provider/${issuerHost(input.issuer)}`)} \\`,
      '  --client-id "$AUDIENCE" \\',
      '  || aws iam create-open-id-connect-provider --url "$ISSUER" --client-id-list "$AUDIENCE"',
      `aws iam create-role --role-name ${shellQuote(roleName)}${path === undefined ? "" : ` --path ${shellQuote(path)}`} \\`,
      "  --assume-role-policy-document file://capy-trust.json",
    ),
    trustExisting: lines(
      `aws iam update-assume-role-policy --role-name ${shellQuote(roleName)} \\`,
      "  --policy-document file://capy-trust.json",
    ),
    trustPolicy: awsTrustPolicy({
      issuer: input.issuer,
      accountId,
      audiences: [audience, ...input.sharedRole.map((t) => t.audience)],
      orgId: input.orgId ?? "<org id>",
      projectIds: [
        input.projectId ?? "<project id>",
        ...input.sharedRole.map((t) => t.projectId),
      ],
    }),
    grant: lines(
      `aws iam attach-role-policy --role-name ${shellQuote(roleName)} \\`,
      "  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsReadOnlyAccess",
    ),
  };
};

export const awsExports = (target: CloudAccessTarget) =>
  lines(
    `AWS_ROLE_ARN=${target.aws?.roleArn ?? ""}`,
    `AWS_WEB_IDENTITY_TOKEN_FILE=${awsTokenFile}`,
    "AWS_ROLE_SESSION_NAME=<thread code>",
    ...(target.aws?.region ? [`AWS_REGION=${target.aws.region}`] : []),
  );

export const awsLikelyFix = (error: string | null | undefined) => {
  if (error === null || error === undefined) return undefined;
  if (error.startsWith("AccessDenied")) {
    return "the role's trust policy does not match this project's aud or sub, update it with the existing-role commands under Trust Capy";
  }
  if (error.startsWith("InvalidIdentityToken")) {
    return "no IAM OIDC provider trusts this issuer and audience yet, run Trust Capy below";
  }
  return "check the role ARN and audience, then verify again";
};

export const gcpCommands = (input: {
  issuer: string;
  orgId: string | undefined;
  projectId: string | null;
  serviceAccountEmail: string;
  projectNumber: string;
}) => {
  const email = input.serviceAccountEmail;
  const number = input.projectNumber;
  const saProject = email
    .split("@")[1]
    ?.replace(".iam.gserviceaccount.com", "");
  return {
    trust: lines(
      `PROJECT_ID=$(gcloud projects describe ${number} --format='value(projectId)')`,
      `gcloud iam workload-identity-pools create ${gcpPoolId} \\`,
      '  --location=global --display-name=Capy --project="$PROJECT_ID"',
      `gcloud iam workload-identity-pools providers create-oidc ${gcpProviderId} \\`,
      `  --location=global --workload-identity-pool=${gcpPoolId} --project="\${PROJECT_ID:?run the first line}" \\`,
      `  --issuer-uri=${input.issuer} \\`,
      "  --attribute-mapping=google.subject=assertion.sub,attribute.org=assertion.org,attribute.project=assertion.project \\",
      `  --attribute-condition="assertion.org=='${input.orgId ?? ""}'"`,
      "gcloud iam service-accounts add-iam-policy-binding \\",
      `  ${email} --project=${saProject ?? ""} \\`,
      "  --role=roles/iam.workloadIdentityUser \\",
      `  --member=principalSet://iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/${gcpPoolId}/attribute.project/${input.projectId ?? ""}`,
    ),
    grant: lines(
      `gcloud projects add-iam-policy-binding ${number} \\`,
      `  --member=serviceAccount:${email} \\`,
      "  --role=roles/logging.viewer",
    ),
  };
};

export const gcpLikelyFix = (
  error: string | null | undefined,
  projectName: string | undefined,
) => {
  if (error === null || error === undefined) return undefined;
  if (/attribute condition/i.test(error)) {
    return "the provider's attribute condition does not match this organization, run Trust Capy below";
  }
  if (/audience|invalid_target/i.test(error)) {
    return "the pool or provider is missing from this project number, run Trust Capy below";
  }
  if (/getAccessToken|permission.*denied|denied on/i.test(error)) {
    return `${projectName ?? "this project"} is not in the service account's binding yet, run Trust Capy below`;
  }
  return "check the service account and project number, then verify again";
};

export const azureCredential = (input: {
  issuer: string;
  orgId: string;
  projectId: string;
}) =>
  JSON.stringify({
    name: `capy-${input.projectId}`,
    issuer: input.issuer,
    subject: subjectFor("azure", input.orgId, input.projectId, "*"),
    audiences: [azureAudience],
  });

export const azureCommands = (input: {
  issuer: string;
  orgId: string | undefined;
  projectId: string | null;
  clientId: string;
}) => {
  const orgId = input.orgId ?? "<org id>";
  const projectId = input.projectId ?? "<project id>";
  const app = shellQuote(
    isAzureId(input.clientId) ? input.clientId : "<client id>",
  );
  const parameters = shellQuote(
    azureCredential({ issuer: input.issuer, orgId, projectId }),
  );
  return {
    subject: subjectFor("azure", orgId, projectId, "*"),
    trust: lines(
      `az ad app federated-credential create --id ${app} \\`,
      `  --parameters ${parameters}`,
    ),
    trustExisting: lines(
      `az ad app federated-credential update --id ${app} \\`,
      `  --federated-credential-id ${shellQuote(`capy-${projectId}`)} \\`,
      `  --parameters ${parameters}`,
    ),
    grant: lines(
      `az ad sp show --id ${app} >/dev/null 2>&1 \\`,
      `  || az ad sp create --id ${app}`,
      "SUBSCRIPTION_ID=$(az account show --query id -o tsv)",
      `az role assignment create --assignee ${app} \\`,
      '  --role Reader --scope "/subscriptions/$SUBSCRIPTION_ID"',
    ),
  };
};

export const azureExports = (target: CloudAccessTarget) =>
  lines(
    `AZURE_TENANT_ID=${target.azure?.tenantId ?? ""}`,
    `AZURE_CLIENT_ID=${target.azure?.clientId ?? ""}`,
    `AZURE_FEDERATED_TOKEN_FILE=${azureTokenFile}`,
  );

export const azureLikelyFix = (error: string | null | undefined) => {
  if (error === null || error === undefined) return undefined;
  if (error.includes("AADSTS70021")) {
    return "no federated credential matches this project's subject, run Trust Capy below";
  }
  if (error.includes("AADSTS700016")) {
    return "the app is not in this tenant, check the tenant and client IDs";
  }
  return "check the tenant and client IDs, then verify again";
};

export const vaultVerifyCommands = `${vaultLoginCommand}\nvault token lookup`;

export const vaultVerifyPrompt = `Check that this project's machines can log in to Vault through Capy cloud credentials. Run these two commands and tell me whether both succeed, with the token's display name and policies:\n\n${vaultVerifyCommands}`;

export const vaultRoleCommand = (input: {
  authMount: string;
  role: string;
  policy: string;
  audience: string;
  orgId: string;
  projectId: string;
}) =>
  lines(
    `vault write ${shellQuote(`auth/${input.authMount}/role/${input.role}`)} - <<'EOF'`,
    JSON.stringify(
      {
        role_type: "jwt",
        user_claim: "project",
        bound_audiences: [input.audience],
        bound_claims_type: "glob",
        bound_claims: {
          sub: `org/${input.orgId}/project/${input.projectId}/thread/*`,
        },
        claim_mappings: { thread: "thread", machine: "machine" },
        token_policies: [input.policy],
        token_ttl: "15m",
        token_max_ttl: "15m",
      },
      null,
      2,
    ),
    "EOF",
  );

export const vaultSetup = (input: {
  issuer: string;
  orgId: string | undefined;
  projectId: string | null;
  address: string;
  role: string | null;
  authMount: string;
  namespace: string;
  audience: string | null;
}) => {
  const address = input.address.trim();
  const defaultRole = input.projectId === null ? "" : `capy-${input.projectId}`;
  const role = (input.role ?? defaultRole).trim();
  const roleName = isVaultRole(role) ? role : "capy-<project id>";
  const policy = `${roleName}-read`;
  const authMount = input.authMount.trim();
  const namespace = input.namespace.trim();
  const audience = (input.audience ?? input.address).trim();
  const mount = isVaultPath(authMount) ? authMount : vaultDefaultAuthMount;
  return {
    address,
    role,
    defaultRole,
    authMount,
    namespace,
    audience,
    policy,
    valid:
      input.projectId !== null &&
      isVaultAddress(address) &&
      isVaultRole(role) &&
      isVaultPath(authMount) &&
      (namespace === "" || isVaultPath(namespace)) &&
      isAudience(audience),
    trust: lines(
      `ISSUER=${shellQuote(input.issuer)}`,
      `export VAULT_ADDR=${shellQuote(isVaultAddress(address) ? address : "https://vault.example.com")}`,
      ...(isVaultPath(namespace)
        ? [`export VAULT_NAMESPACE=${shellQuote(namespace)}`]
        : []),
      `vault auth enable -path=${shellQuote(mount)} jwt`,
      `vault write ${shellQuote(`auth/${mount}/config`)} oidc_discovery_url="$ISSUER" bound_issuer="$ISSUER"`,
      vaultRoleCommand({
        authMount: mount,
        role: roleName,
        policy,
        audience: isAudience(audience) ? audience : "<audience>",
        orgId: input.orgId ?? "<org id>",
        projectId: input.projectId ?? "<project id>",
      }),
    ),
    grant: lines(
      `vault policy write ${shellQuote(policy)} - <<'EOF'`,
      `path "secret/data/${roleName}/*" {`,
      '  capabilities = ["read"]',
      "}",
      "EOF",
    ),
  };
};

export const vaultExports = (target: CloudAccessTarget) =>
  target.vault === null
    ? ""
    : lines(
        `VAULT_ADDR=${target.vault.address}`,
        ...(target.vault.namespace === null
          ? []
          : [`VAULT_NAMESPACE=${target.vault.namespace}`]),
        `CAPY_VAULT_AUTH_MOUNT=${target.vault.authMount}`,
        `CAPY_VAULT_ROLE=${target.vault.role}`,
      );

export const oidcTrustValues = (input: {
  issuer: string;
  audience: string;
  subject: string | undefined;
  orgId: string | undefined;
  projectId: string | null;
}) =>
  lines(
    `issuer: ${input.issuer}`,
    `audience: ${input.audience}`,
    `subject: ${input.subject ?? `org/${input.orgId ?? ""}/project/${input.projectId ?? ""}/thread/*`}`,
  );

export const oidcExampleToken = (issuer: string | undefined, orgId: string) =>
  JSON.stringify(
    {
      iss: issuer ?? "<issuer URL>",
      sub: `org/${orgId}/project/<project id>/thread/<thread code>`,
      aud: "<audience>",
      iat: 1792425600,
      nbf: 1792425540,
      exp: 1792426500,
      jti: "<token id>",
      org: orgId,
      project: "<project id>",
      thread: "<thread code>",
      machine: "<machine id>",
      user: "<user id>",
    },
    null,
    2,
  );
