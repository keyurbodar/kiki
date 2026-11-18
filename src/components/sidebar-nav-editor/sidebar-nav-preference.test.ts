import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_NAV_DEFAULTS, type SidebarNavEntry } from "./sidebar-nav";
import {
  readSidebarNavPreference,
  useSidebarNavPreference,
  writeSidebarNavPreference,
} from "./sidebar-nav-preference";

beforeEach(() => localStorage.clear());

const hidden = (item: string): SidebarNavEntry => ({
  item: item as SidebarNavEntry["item"],
  hidden: true,
});

describe("sidebar nav preference", () => {
  it("defaults to every page until something is stored", () => {
    expect(readSidebarNavPreference()).toEqual([...SIDEBAR_NAV_DEFAULTS]);
  });

  it("keeps the stored choice and normalizes it back to the full list", () => {
    writeSidebarNavPreference([hidden("issues")]);
    const stored = readSidebarNavPreference();
    expect(stored.find((entry) => entry.item === "issues")?.hidden).toBe(true);
    expect(stored).toHaveLength(SIDEBAR_NAV_DEFAULTS.length);
  });

  it("stores null once every page is shown again", () => {
    writeSidebarNavPreference([hidden("issues")]);
    writeSidebarNavPreference([...SIDEBAR_NAV_DEFAULTS]);
    expect(localStorage.getItem("capy-web:sidebar-nav")).toBe("null");
  });

  it("updates every consumer when one of them writes", () => {
    const sidebar = renderHook(() => useSidebarNavPreference());
    const menu = renderHook(() => useSidebarNavPreference());
    expect(sidebar.result.current[0]).toEqual([...SIDEBAR_NAV_DEFAULTS]);
    act(() => menu.result.current[1]([hidden("pullRequests")]));
    expect(
      sidebar.result.current[0].find((entry) => entry.item === "pullRequests")
        ?.hidden,
    ).toBe(true);
  });
});
