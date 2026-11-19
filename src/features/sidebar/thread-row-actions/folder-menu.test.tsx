import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SidebarFolder } from "@/components/sidebar-threads";
import { FolderOptionsMenu } from "./folder-menu";

afterEach(cleanup);

const folder = (patch: Partial<SidebarFolder> = {}): SidebarFolder => ({
  id: "f1",
  name: "Release",
  visibility: "shared",
  viewerRole: "owner",
  ownerUserId: "user_alex",
  members: [{ userId: "user_sam" }],
  hidden: false,
  ...patch,
});

const actions = () => ({
  onRename: vi.fn(),
  onShare: vi.fn(),
  onToggleHidden: vi.fn(),
  onLeave: vi.fn(),
  onDelete: vi.fn(),
});

const openMenu = async (
  target: SidebarFolder,
  handlers: ReturnType<typeof actions> = actions(),
) => {
  render(<FolderOptionsMenu folder={target} actions={handlers} />);
  fireEvent.click(screen.getByRole("button", { name: "Folder options" }));
  await screen.findByText("Rename folder");
  return handlers;
};

const rows = async () =>
  screen.getAllByRole("menuitem").map((item) => item.textContent?.trim());

describe("folder options menu", () => {
  it("renders Capy's rows for a folder the viewer owns and has shared", async () => {
    await openMenu(folder());
    expect(await rows()).toEqual([
      "Rename folder",
      "Share folder",
      "Hide from sidebar",
      "Delete folder",
    ]);
  });

  it("offers a private folder no Share row", async () => {
    await openMenu(folder({ visibility: "private" }));
    expect(await rows()).toEqual([
      "Rename folder",
      "Hide from sidebar",
      "Delete folder",
    ]);
  });

  it("offers Leave folder to a member and Show in sidebar to a hidden folder", async () => {
    await openMenu(folder({ viewerRole: "member", hidden: true }));
    expect(await rows()).toEqual([
      "Rename folder",
      "Share folder",
      "Show in sidebar",
      "Leave folder",
      "Delete folder",
    ]);
  });

  it("runs the row the viewer picks", async () => {
    const handlers = await openMenu(folder());
    fireEvent.click(screen.getByText("Hide from sidebar"));
    expect(handlers.onToggleHidden).toHaveBeenCalledOnce();
    expect(handlers.onDelete).not.toHaveBeenCalled();
  });
});
