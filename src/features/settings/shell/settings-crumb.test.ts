import { expect, it } from "vitest";
import { pluginUpdateInstallationId, settingsCrumb } from "./settings-crumb";

it("has no crumb on top-level settings pages", () => {
  expect(settingsCrumb("/settings/general")).toBeUndefined();
  expect(settingsCrumb("/settings/appearance")).toBeUndefined();
});

it("takes the most specific prefix", () => {
  expect(settingsCrumb("/settings/appearance/themes/abc")).toEqual({
    to: "/settings/appearance/themes",
    label: "Your themes",
  });
  expect(settingsCrumb("/settings/cloud-credentials/aws/new")?.label).toBe(
    "AWS",
  );
  expect(settingsCrumb("/settings/notifications/email")?.label).toBe(
    "Notifications",
  );
});

it("builds project crumbs", () => {
  expect(settingsCrumb("/settings/projects/p1")).toEqual({
    to: "/settings/projects",
    label: "Projects & setup",
  });
  expect(
    settingsCrumb("/settings/projects/p1/dev-environment/builds/b1"),
  ).toEqual({
    to: "/settings/projects/$projectId/dev-environment",
    params: { projectId: "p1" },
    label: "Setup & snapshot",
  });
  expect(
    settingsCrumb("/settings/projects/p1/environment-variables")?.label,
  ).toBe("Project");
  expect(
    settingsCrumb("/settings/projects/p1/mcp/new", () => "Website")?.label,
  ).toBe("Website");
});

it("reads the plugin installation id on the update page", () => {
  expect(pluginUpdateInstallationId("/settings/mcp/plugins/i1/update")).toBe(
    "i1",
  );
  expect(
    pluginUpdateInstallationId("/settings/mcp/plugins/i1"),
  ).toBeUndefined();
});
