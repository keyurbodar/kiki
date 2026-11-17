export type SettingsCrumb = {
  to: string;
  params?: Record<string, string>;
  label: string;
};

const prefixCrumbs: readonly (SettingsCrumb & { prefix: string })[] = [
  {
    prefix: "/settings/appearance/themes/",
    to: "/settings/appearance/themes",
    label: "Your themes",
  },
  {
    prefix: "/settings/appearance/",
    to: "/settings/appearance",
    label: "Appearance",
  },
  {
    prefix: "/settings/mcp/marketplace/",
    to: "/settings/mcp/marketplace",
    label: "Marketplace",
  },
  { prefix: "/settings/mcp/", to: "/settings/mcp", label: "MCP & plugins" },
  {
    prefix: "/settings/cloud-credentials/gcp/",
    to: "/settings/cloud-credentials/gcp",
    label: "Google Cloud",
  },
  {
    prefix: "/settings/cloud-credentials/aws/",
    to: "/settings/cloud-credentials/aws",
    label: "AWS",
  },
  {
    prefix: "/settings/cloud-credentials/vault/",
    to: "/settings/cloud-credentials/vault",
    label: "Vault",
  },
  {
    prefix: "/settings/cloud-credentials/azure/",
    to: "/settings/cloud-credentials/azure",
    label: "Azure",
  },
  {
    prefix: "/settings/cloud-credentials/oidc/",
    to: "/settings/cloud-credentials/oidc",
    label: "Generic OIDC",
  },
  {
    prefix: "/settings/cloud-credentials/",
    to: "/settings/cloud-credentials",
    label: "Cloud credentials",
  },
  {
    prefix: "/settings/integrations/",
    to: "/settings/integrations",
    label: "Integrations",
  },
  { prefix: "/settings/api/", to: "/settings/api", label: "API" },
  { prefix: "/settings/devices/", to: "/settings/devices", label: "Devices" },
  {
    prefix: "/settings/notifications/",
    to: "/settings/notifications",
    label: "Notifications",
  },
];

const projectPath = /^\/settings\/projects\/([^/]+)(?:\/([^/]+)(?:\/(.+))?)?$/;

function projectCrumb(
  pathname: string,
  projectName: (projectId: string) => string | undefined,
): SettingsCrumb | undefined {
  const match = projectPath.exec(pathname);
  if (match === null) return undefined;
  const [, projectId = "", child, rest] = match;
  if (child === undefined)
    return { to: "/settings/projects", label: "Projects & setup" };
  if (child === "dev-environment" && rest !== undefined)
    return {
      to: "/settings/projects/$projectId/dev-environment",
      params: { projectId },
      label: "Setup & snapshot",
    };
  return {
    to: "/settings/projects/$projectId",
    params: { projectId },
    label: projectName(projectId) ?? "Project",
  };
}

/** The back crumb Capy's settings layout shows in the top bar for nested pages. */
export function settingsCrumb(
  pathname: string,
  projectName: (projectId: string) => string | undefined = () => undefined,
): SettingsCrumb | undefined {
  const project = projectCrumb(pathname, projectName);
  if (project !== undefined) return project;
  const match = prefixCrumbs.find((crumb) => pathname.startsWith(crumb.prefix));
  return match && { to: match.to, label: match.label };
}

const pluginUpdatePath = /^\/settings\/mcp\/plugins\/([^/]+)\/update$/;

/** The plugin installation id on `/settings/mcp/plugins/$id/update`, whose crumb names the plugin. */
export const pluginUpdateInstallationId = (pathname: string) =>
  pluginUpdatePath.exec(pathname)?.[1];
