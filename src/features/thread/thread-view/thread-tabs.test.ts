import { describe, expect, it } from "vitest";
import { tabKey } from "@/features/thread-panes/tab-strip";
import { tabForKey } from "./thread-tabs";

/**
 * The header's open-a-tab menu hands the strip a tab's own key, so every key a
 * tab builds has to resolve back to it. Before this, a side thread, a subagent,
 * a service or a phone row closed the menu and opened nothing, because the key
 * found no pane and no tab.
 */
describe("tabForKey round-trips a tab's own key", () => {
  const keys = [
    "side-thread:jam_sample_child1",
    "side-thread-draft:draft_1",
    "task:jam_sample_child2",
    "service-preview:machine_sample_cloud1:8080",
    "phone:machine_sample_cloud1",
    "issue:AMA-7",
    "drive-file:handoffs/notes.md",
  ];

  for (const key of keys)
    it(`resolves ${key}`, () => {
      const tab = tabForKey(key);
      expect(tab).toBeDefined();
      expect(tabKey(tab as NonNullable<typeof tab>)).toBe(key);
    });

  it("leaves an unknown kind alone", () => {
    expect(tabForKey("nothing:here")).toBeUndefined();
    expect(tabForKey("side-thread:")).toBeUndefined();
    expect(tabForKey("service-preview:machine_1:not-a-port")).toBeUndefined();
  });
});
