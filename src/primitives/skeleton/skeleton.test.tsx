import { readdirSync, readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from ".";

afterEach(cleanup);

describe("Skeleton", () => {
  it("draws a measured skeleton from sample content while data is absent", () => {
    const { container } = render(
      <Skeleton
        data={null}
        sample={{ name: "Deploy from the issue list" }}
        label="Loading skills"
      >
        {(skill) => <p>{skill.name}</p>}
      </Skeleton>,
    );
    const reveal = container.querySelector<HTMLElement>("[skullet-reveal]");
    expect(reveal).not.toBeNull();
    expect(reveal?.getAttribute("aria-busy")).toBe("true");
    // The ghost the skeleton is measured from is never seen, only measured.
    const loading = reveal?.querySelector<HTMLElement>("[skullet-loading]");
    expect(loading?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Loading skills")).toBeTruthy();
  });

  it("renders the content once data has landed", () => {
    const { container } = render(
      <Skeleton data={{ name: "Deploy from the issue list" }}>
        {(skill) => <p>{skill.name}</p>}
      </Skeleton>,
    );
    expect(screen.getByText("Deploy from the issue list")).toBeTruthy();
    const reveal = container.querySelector<HTMLElement>("[skullet-reveal]");
    expect(reveal?.getAttribute("aria-busy")).toBeNull();
    expect(reveal?.querySelector("[skullet-loading]")).toBeNull();
  });

  it("announces a generic label when the surface gives none", () => {
    render(
      <Skeleton loading>
        <p>row</p>
      </Skeleton>,
    );
    expect(screen.getByText("Loading")).toBeTruthy();
  });
});

/**
 * skullet is ported, not vendored: every import goes through this primitive,
 * the same ownership rule as the toaster's, so a call site cannot render a
 * skeleton that misses the token theming (or mounts a second stylesheet).
 */
describe("skeleton ownership", () => {
  const sources = readdirSync("src", { recursive: true, encoding: "utf8" })
    .map((path) => `src/${path.replaceAll("\\", "/")}`)
    .filter((path) => /\.tsx?$/.test(path));

  it("imports skullet only from this primitive", () => {
    const offenders = sources.filter(
      (path) =>
        !path.startsWith("src/primitives/skeleton/") &&
        /from "skullet(\/[^"]*)?"/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
