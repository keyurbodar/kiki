import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SidebarThread } from "@/components/sidebar-threads";
import { SidebarThreadRow } from "./sidebar-thread-row";

const thread: SidebarThread = {
  id: "thread_specimen_1",
  title: "Capy retry backoff",
  status: "idle",
  needsYou: false,
  ask: null,
  hasUnreads: false,
  age: "2m",
  projectId: null,
  machine: null,
};

afterEach(() => {
  cleanup();
});

describe("SidebarThreadRow", () => {
  it("draws a row without a link when it is decoration for a specimen", () => {
    const { container } = render(
      <SidebarThreadRow thread={thread} decorative />,
    );
    const row = container.querySelector('[data-slot="sidebar-thread-row"]');
    expect(row?.tagName).toBe("SPAN");
    expect(container.querySelector("a")).toBeNull();
  });
});
