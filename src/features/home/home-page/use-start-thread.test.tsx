import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ComposerPayload } from "@/components/composer";
import { OrgId } from "@/data/api/schemas/ids";
import { org, projects } from "@/data/mocks/fixtures/world";
import { draftTitle, jamIdOf, useStartThread } from "./use-start-thread";

afterEach(cleanup);

const orgId = OrgId.make(org.id);

const payload = (text: string): ComposerPayload => ({
  text,
  mentions: [],
  files: [],
});

const target: { projectId?: string } = {};

function StartRoute() {
  const start = useStartThread();
  return (
    <button
      type="button"
      onClick={() => {
        void start({
          orgId,
          projectId: target.projectId,
          payload: payload("Ship the retry fix"),
        });
      }}
    >
      Start
    </button>
  );
}

async function renderStart(projectId?: string) {
  target.projectId = projectId;
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/new",
        component: StartRoute,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/thread/$threadId",
        component: () => null,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/new"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

describe("jamIdOf", () => {
  it("reads the id of a jam the A3 client returned undecoded", () => {
    expect(jamIdOf({ id: "jam_1", title: "x" })).toBe("jam_1");
  });

  it("refuses anything that is not a jam", () => {
    expect(jamIdOf(undefined)).toBeUndefined();
    expect(jamIdOf(null)).toBeUndefined();
    expect(jamIdOf("jam_1")).toBeUndefined();
    expect(jamIdOf({ jamId: "jam_1" })).toBeUndefined();
  });
});

describe("draftTitle", () => {
  it("uses the first line of the draft", () => {
    expect(draftTitle("Ship the retry fix\n\nThen the docs")).toBe(
      "Ship the retry fix",
    );
  });

  it("has no title for an empty draft", () => {
    expect(draftTitle("   \n\n")).toBeUndefined();
  });

  it("caps a long first line", () => {
    expect(draftTitle("a".repeat(200))).toHaveLength(80);
  });
});

describe("useStartThread", () => {
  it("creates a project thread and opens it", async () => {
    const router = await renderStart(projects.web.id);
    fireEvent.click(document.querySelector("button") as HTMLButtonElement);
    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/thread\/jam_/),
    );
  });

  it("creates a projectless thread when no project is chosen", async () => {
    const router = await renderStart();
    fireEvent.click(document.querySelector("button") as HTMLButtonElement);
    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(/^\/thread\/jam_/),
    );
  });

  it("stays on /new when the thread could not be created", async () => {
    const router = await renderStart("proj_missing");
    fireEvent.click(document.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(router.state.location.pathname).toBe("/new"));
  });
});
