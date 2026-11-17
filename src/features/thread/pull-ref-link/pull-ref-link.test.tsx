import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PullRef } from "./pull-ref";
import { type OpenPull, PullRefContext, PullRefLink } from "./pull-ref-link";

afterEach(cleanup);

const pull: PullRef = {
  repo: "acme/web",
  number: 128,
  state: "merged",
  url: "https://github.com/acme/web/pull/128",
};

const renderLink = async (link: ReactNode, openPr?: OpenPull) => {
  const root = createRootRoute({
    component: () => (
      <PullRefContext
        value={{ pullRequests: new Map([["acme/web#128", pull]]), openPr }}
      >
        <p>{link}</p>
      </PullRefContext>
    ),
  });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  return screen.findByRole("link");
};

describe("PullRefLink", () => {
  it("links a known pull to its page with its state icon", async () => {
    const link = await renderLink(
      <PullRefLink href="https://github.com/Acme/web/pull/128">
        #128
      </PullRefLink>,
    );
    expect(link.getAttribute("href")).toBe("/pull/Acme/web/128");
    expect(link.textContent).toBe("#128");
    const icon = link.querySelector("svg");
    expect(icon?.getAttribute("data-icon")).toBe("merged");
    expect(icon?.getAttribute("class")).toContain("text-complete");
    expect(link.className).toContain("whitespace-nowrap");
  });

  it("leaves out the icon for a pull the thread doesn't know", async () => {
    const link = await renderLink(
      <PullRefLink href="https://github.com/acme/api/pull/4">#4</PullRefLink>,
    );
    expect(link.getAttribute("href")).toBe("/pull/acme/api/4");
    expect(link.querySelector("svg")).toBeNull();
  });

  it("opens the pull in the thread pane on a plain click", async () => {
    const openPr = vi.fn();
    const link = await renderLink(
      <PullRefLink href="https://github.com/acme/web/pull/128">
        #128
      </PullRefLink>,
      openPr,
    );
    fireEvent.click(link);
    expect(openPr).toHaveBeenCalledWith({ number: 128, url: pull.url });
    fireEvent.click(link, { metaKey: true });
    expect(openPr).toHaveBeenCalledTimes(1);
  });

  it("falls back to a plain external link for other URLs", async () => {
    const link = await renderLink(
      <PullRefLink href="https://example.com/notes" className="font-medium">
        notes
      </PullRefLink>,
    );
    expect(link.getAttribute("href")).toBe("https://example.com/notes");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(link.className).toContain("font-medium");
  });
});
