import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

type Node = {
  options?: { id?: string };
  children?: Record<string, Node> | Node[];
};

const DEV_ONLY_ROUTES = new Set([
  "/__tokens",
  "/__composer-footer",
  "/__composer",
  "/__thread-device",
  "/__media-lightbox",
  "/__chips",
]);

function countRoutes(node: Node): number {
  const children = Object.values(node.children ?? {}).filter(
    (child) => !DEV_ONLY_ROUTES.has(child.options?.id ?? ""),
  );
  return children.reduce((sum, child) => sum + 1 + countRoutes(child), 0);
}

async function resolve(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return router.state.location.href;
}

describe("route contract", () => {
  it("registers every app route from the parity map", () => {
    expect(countRoutes(routeTree as Node)).toBe(159);
  });

  it.each([
    ["/", "/new"],
    ["/settings", "/settings/general"],
    ["/project/p1/jam/j1", "/thread/j1"],
    ["/project/p1/settings", "/settings/projects/p1"],
    [
      "/settings/integrations/cloud-access/aws/t1",
      "/settings/cloud-credentials/aws/t1",
    ],
    ["/volumes/s1", "/drive/s1"],
  ])("redirects %s to %s", async (from, to) => {
    expect(await resolve(from)).toBe(to);
  });

  it("keeps declared search params", async () => {
    expect(await resolve("/thread/t1?pane=files")).toBe(
      "/thread/t1?pane=files",
    );
  });
});
