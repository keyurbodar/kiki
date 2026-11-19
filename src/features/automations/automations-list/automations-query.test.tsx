import { RegistryProvider } from "@effect/atom-react";
import { cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as failure from "@/data/mocks/failure";
import { useAutomationsPage, useOrgMembers } from "./automations-query";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <RegistryProvider>{children}</RegistryProvider>
);

/** The URLs the mock saw while `mount` ran. */
const urlsWhileMounting = async (mount: () => void) => {
  const spy = vi.spyOn(failure, "failsMockRequest");
  mount();
  await new Promise((resolve) => setTimeout(resolve, 50));
  return spy.mock.calls.map(([url]) => url);
};

const mountList = (orgId: string | undefined) => () => {
  renderHook(
    () => {
      useOrgMembers(orgId);
      return useAutomationsPage(orgId, "{}", []);
    },
    { wrapper },
  );
};

describe("the automations list before the org resolves", () => {
  it("reads nothing org-scoped while the org is unresolved", async () => {
    const urls = await urlsWhileMounting(mountList(undefined));
    expect(urls.filter((url) => url.includes("/orgs//"))).toEqual([]);
  });

  it("reads the org's automations and members once it is known", async () => {
    const urls = await urlsWhileMounting(mountList("org_sample_acme"));
    expect(
      urls.some((url) =>
        url.startsWith("http://kiki.mock/orgs/org_sample_acme/"),
      ),
    ).toBe(true);
  });
});
