import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ProjectChip, projectChipColor, projectInitials } from "./project-chip";
import type { SidebarProject } from "./types";

afterEach(cleanup);

const project = (overrides: Partial<SidebarProject> = {}): SidebarProject => ({
  id: "project_web",
  name: "Web app",
  logoUrl: null,
  icon: "folder",
  ...overrides,
});

it("paints the project's own glyph when it has a chosen icon", () => {
  const { container } = render(
    <ProjectChip project={project({ icon: "globe" })} />,
  );
  expect(container.querySelector('svg[data-icon="globe"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="project-chip"]')).toBeNull();
  expect(container.textContent).toBe("");
});

it("falls back to the hashed initials tile for the unchosen folder icon", () => {
  const { container } = render(<ProjectChip project={project()} />);
  const chip = container.querySelector('[data-slot="project-chip"]');
  expect(chip?.textContent).toBe("WA");
  expect(chip?.className).toContain(projectChipColor("project_web"));
  expect(container.querySelector("svg")).toBeNull();
});

it("paints the logo image ahead of either fallback", () => {
  const { container } = render(
    <ProjectChip
      project={project({ logoUrl: "https://logos.example.com/web.png" })}
    />,
  );
  expect(container.querySelector("img")?.getAttribute("src")).toBe(
    "https://logos.example.com/web.png",
  );
  expect(container.querySelector('[data-slot="project-chip"]')).toBeNull();
});

it("initialises from the first and last word", () => {
  expect(projectInitials("Web app")).toBe("WA");
  expect(projectInitials("kiki")).toBe("KI");
  expect(projectInitials("Keyur's docs")).toBe("KD");
});
