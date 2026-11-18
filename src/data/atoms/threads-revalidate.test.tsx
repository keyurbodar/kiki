import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { AtomRegistry } from "effect/reactivity";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrgId } from "../api/schemas/ids";
import { threadsAtom, useThreadsAtom } from "./threads";

const orgId = OrgId.make("org_sample_acme");

const wrapper =
  (registry: AtomRegistry.AtomRegistry) =>
  ({ children }: { children: ReactNode }) => (
    <RegistryContext.Provider value={registry}>
      {children}
    </RegistryContext.Provider>
  );

/** The shell's palette host: reads the list for the app's whole lifetime. */
const usePaletteHost = () => useAtomValue(threadsAtom(orgId));
/** A screen the reader leaves and comes back to. */
const useSurface = () => useAtomValue(useThreadsAtom(orgId));

/** Let the query resolve and React commit, on the fake clock. */
const settle = async (ms = 50) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const stampOf = (result: unknown) =>
  (result as { _tag: string; timestamp?: number })._tag === "Success"
    ? ((result as { timestamp: number }).timestamp ?? -1)
    : -1;

/**
 * The shell mounts `CommandPaletteHost` and the project select for the app's
 * lifetime, and both read the thread list. Wrapping the atom itself put the
 * revalidate trigger on that shared node, which therefore never idled, never
 * rebuilt, and never fired — the feature shipped and did nothing. These tests
 * hold the trigger to the surface that mounts, with the shell's reader present.
 */
describe("useThreadsAtom", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("re-reads when a surface mounts again after the stale window", async () => {
    vi.useFakeTimers();
    const registry = AtomRegistry.make();
    const shell = renderHook(() => usePaletteHost(), {
      wrapper: wrapper(registry),
    });
    await settle();
    expect(stampOf(shell.result.current)).toBeGreaterThan(0);

    const surface = renderHook(() => useSurface(), {
      wrapper: wrapper(registry),
    });
    await settle();
    const first = stampOf(surface.result.current);
    expect(first).toBeGreaterThan(0);

    surface.unmount();
    await settle(31_000);

    const remount = renderHook(() => useSurface(), {
      wrapper: wrapper(registry),
    });
    await settle();
    expect(stampOf(remount.result.current)).toBeGreaterThan(first);

    remount.unmount();
    shell.unmount();
  });

  it("does not re-read when the reader comes back inside the window", async () => {
    vi.useFakeTimers();
    const registry = AtomRegistry.make();
    const shell = renderHook(() => usePaletteHost(), {
      wrapper: wrapper(registry),
    });
    await settle();

    const surface = renderHook(() => useSurface(), {
      wrapper: wrapper(registry),
    });
    await settle();
    const first = stampOf(surface.result.current);
    surface.unmount();
    await settle(1_000);

    const remount = renderHook(() => useSurface(), {
      wrapper: wrapper(registry),
    });
    await settle();
    expect(stampOf(remount.result.current)).toBe(first);

    remount.unmount();
    shell.unmount();
  });
});
