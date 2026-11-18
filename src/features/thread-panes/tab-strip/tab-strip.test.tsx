import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
} from "@/primitives/responsive-menu";
import { TabStrip } from "./tab-strip";
import {
  EntriesPageBody,
  type MachineEntry,
  ThreadOptions,
  type ThreadOptionsProps,
} from "./thread-options";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("@/primitives/toaster", async () => ({
  ...(await vi.importActual<typeof import("@/primitives/toaster")>(
    "@/primitives/toaster",
  )),

  toast: Object.assign(vi.fn(), { error: toastError, success: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  toastError.mockReset();
});

/** The open-a-tab menu as the strip mounts it: open, with its level stack. */
function OpenMenu({ children }: { children: ReactNode }) {
  return (
    <ResponsiveMenu open>
      <ResponsiveMenuContent>{children}</ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

const pushedPage = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="responsive-menu-level"][data-nav="push"]',
  );

/** The pushed page's back row, which returns the menu to its item list. */
const backRow = () => {
  const row = pushedPage()?.querySelector<HTMLElement>('[role="menuitem"]');
  if (row === null || row === undefined) throw new Error("no pushed page");
  fireEvent.click(row);
};

const machine: MachineEntry = {
  machineId: "machine_1",
  state: "awake",
  statusLabel: "Awake",
  statusColor: "success",
  device: true,
};

const base: ThreadOptionsProps = {
  title: "Ship the onboarding flow",
  openIds: new Set(["overview"]),
  onOpen: () => {},
  onOpenBrowser: () => {},
  machines: [machine],
};

const rowLabels = () =>
  screen.getAllByRole("menuitem").map((row) => row.textContent ?? "");

describe("ThreadOptions", () => {
  it("lists a thread's tabs, browser, side threads and terminals", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} />
      </OpenMenu>,
    );
    expect(screen.getByText("Ship the onboarding flow")).toBeTruthy();
    const rows = rowLabels();
    expect(rows[0]).toContain("Overview");
    expect(
      rows
        .slice(1, 5)
        .map((row) => row.replace(/[⇧⌘A-Z]+$|Ctrl\+Shift\+[A-Z]$/, "")),
    ).toEqual(["Diffs", "Files", "Setup", "Browser"]);
    expect(rows.some((row) => row.startsWith("Side threads0"))).toBe(true);
    expect(screen.getByText("Terminals")).toBeTruthy();
    expect(screen.getByText("Awake")).toBeTruthy();
    expect(rows.some((row) => row.startsWith("New terminal"))).toBe(true);
    expect(rows.some((row) => row.startsWith("Desktop"))).toBe(false);
  });

  it("checks tabs that are already open", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} />
      </OpenMenu>,
    );
    const [overview, , files] = screen.getAllByRole("menuitem");
    expect(overview?.querySelectorAll("svg")).toHaveLength(2);
    expect(files?.querySelectorAll("svg")).toHaveLength(1);
  });

  it("swaps diffs for issues, crew and pull requests on a captain", () => {
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          title={undefined}
          crew={[{ id: "jam_9", title: "Fix the flaky test", active: true }]}
          pulls={[{ number: 7, url: "https://github.com/acme/web/pull/7" }]}
        />
      </OpenMenu>,
    );
    expect(screen.getByText("Captain")).toBeTruthy();
    const rows = rowLabels();
    expect(rows.some((row) => row.startsWith("Diffs"))).toBe(false);
    expect(rows.some((row) => row.startsWith("Issues"))).toBe(true);
    expect(screen.getByText("Crew")).toBeTruthy();
    expect(screen.getByText("Fix the flaky test")).toBeTruthy();
    expect(rows.some((row) => row.startsWith("All threads1"))).toBe(true);
    expect(rows.some((row) => row.startsWith("Pull requests1"))).toBe(true);
  });

  it("filters by search and says when nothing matches", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} machines={[]} />
      </OpenMenu>,
    );
    const search = screen.getByRole("textbox", { name: "Search tabs" });
    fireEvent.change(search, { target: { value: "drive" } });
    expect(rowLabels()).toEqual(["Files"]);
    fireEvent.change(search, { target: { value: "qqqq" } });
    expect(screen.getByText("No tabs found")).toBeTruthy();
  });

  it("opens the picked tab", () => {
    const onOpen = vi.fn();
    render(
      <OpenMenu>
        <ThreadOptions {...base} onOpen={onOpen} />
      </OpenMenu>,
    );
    fireEvent.click(screen.getByText("Setup"));
    expect(onOpen).toHaveBeenCalledWith({ kind: "setup" });
  });

  it("scopes the Desktop tab to the owning thread, not the machine", () => {
    const onOpen = vi.fn();
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          threadId="jam_1"
          machines={[{ ...machine, device: false }]}
          onOpen={onOpen}
        />
      </OpenMenu>,
    );
    const desktop = screen
      .getAllByRole("menuitem")
      .find((row) => row.textContent?.startsWith("Desktop"));
    expect(desktop).toBeTruthy();
    if (desktop === undefined) throw new Error("Desktop row missing");
    fireEvent.click(desktop);
    expect(onOpen).toHaveBeenCalledWith({
      kind: "desktop",
      jamId: "jam_1",
      localIndex: null,
    });
  });

  it("keeps category children when the section label matches the search", () => {
    const onOpen = vi.fn();
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          threadId="jam_1"
          machines={[]}
          phones={[
            {
              machineId: "phone_1",
              name: "Sample phone",
              description: "Sample device",
              state: "awake",
            },
          ]}
          pulls={[
            {
              number: 7,
              url: "https://github.com/acme/web/pull/7",
              title: "Fix startup",
            },
          ]}
          onOpen={onOpen}
        />
      </OpenMenu>,
    );
    const search = screen.getByRole("textbox", { name: "Search tabs" });
    fireEvent.change(search, { target: { value: "phones" } });
    fireEvent.click(screen.getByText("Phones"));
    expect(screen.getByText("Sample phone")).toBeTruthy();
  });

  it("toasts when a phone cannot be added", async () => {
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          phones={[]}
          onAddPhone={() => Promise.reject(new Error("quota"))}
        />
      </OpenMenu>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search tabs" }), {
      target: { value: "android" },
    });
    fireEvent.click(screen.getByText("Phones"));
    fireEvent.click(await screen.findByText("New Android"));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("The phone could not be added"),
    );
  });

  it("toasts when a command cannot launch", async () => {
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          machines={[
            {
              ...machine,
              commands: [
                { name: "Seed", command: "bun seed", repository: "acme/web" },
              ],
            },
          ]}
          onLaunch={() => Promise.reject(new Error("boom"))}
        />
      </OpenMenu>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search tabs" }), {
      target: { value: "seed" },
    });
    fireEvent.click(screen.getByText("Seed"));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Could not launch Seed"),
    );
  });
});

describe("EntriesPage", () => {
  const sideThreads = [
    { id: "jam_side1", title: "Stub the payment gateway" },
    { id: "jam_side2", title: "Add a retry budget" },
  ];

  it("replaces the menu's item list in place instead of opening a submenu", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} sideThreads={sideThreads} />
      </OpenMenu>,
    );
    const list = document.querySelector('[data-slot="responsive-menu-level"]');
    fireEvent.click(screen.getByText("Side threads"));

    const page = pushedPage();
    expect(page).not.toBeNull();
    expect(list?.className).toContain("hidden");
    expect(page?.querySelector('[role="menuitem"]')?.textContent).toBe(
      "Side threads",
    );
    expect(
      page?.contains(screen.getByPlaceholderText("Search side threads")),
    ).toBe(true);
    expect(page?.textContent).toContain("Stub the payment gateway");
    expect(page?.textContent).toContain("Add a retry budget");
  });

  it("searches inside the page and says when nothing matches", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} sideThreads={sideThreads} />
      </OpenMenu>,
    );
    fireEvent.click(screen.getByText("Side threads"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search side threads" }),
      { target: { value: "retry" } },
    );
    const page = pushedPage();
    expect(page?.textContent).toContain("Add a retry budget");
    expect(page?.textContent).not.toContain("Stub the payment gateway");
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search side threads" }),
      { target: { value: "zzz" } },
    );
    expect(page?.textContent).toContain("No matches");
  });

  it("goes back to the item list from the page's back row", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} sideThreads={sideThreads} />
      </OpenMenu>,
    );
    const list = document.querySelector('[data-slot="responsive-menu-level"]');
    fireEvent.click(screen.getByText("Side threads"));
    expect(pushedPage()?.querySelector('[role="menuitem"]')?.textContent).toBe(
      "Side threads",
    );
    backRow();
    expect(pushedPage()).toBeNull();
    expect(list?.className).not.toContain("hidden");
  });

  it("opens All threads and Pull requests as pages of the same menu", () => {
    render(
      <OpenMenu>
        <ThreadOptions
          {...base}
          title={undefined}
          crew={[{ id: "jam_9", title: "Fix the flaky test" }]}
          pulls={[{ number: 7, url: "https://github.com/acme/web/pull/7" }]}
        />
      </OpenMenu>,
    );
    fireEvent.click(screen.getByText("All threads"));
    expect(pushedPage()?.textContent).toContain("Fix the flaky test");
    backRow();
    fireEvent.click(screen.getByText("Pull requests"));
    const page = pushedPage();
    expect(page?.textContent).toContain("#7");
    expect(
      page?.contains(screen.getByPlaceholderText("Search pull requests")),
    ).toBe(true);
  });

  it("says the page is empty when the list has no rows", () => {
    render(
      <OpenMenu>
        <ThreadOptions {...base} title={undefined} crew={[]} pulls={[]} />
      </OpenMenu>,
    );
    fireEvent.click(screen.getByText("All threads"));
    expect(pushedPage()?.textContent).toContain("No all threads");
    backRow();
    fireEvent.click(screen.getByText("Pull requests"));
    expect(pushedPage()?.textContent).toContain("No pull requests");
  });
});

describe("EntriesPageBody", () => {
  it("says the list is empty, then that a search has no matches", () => {
    render(
      <OpenMenu>
        <EntriesPageBody label="Side threads" searchLabel="Search side threads">
          {() => []}
        </EntriesPageBody>
      </OpenMenu>,
    );
    expect(screen.getByText("No side threads")).toBeTruthy();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search side threads" }),
      {
        target: { value: "x" },
      },
    );
    expect(screen.getByText("No matches")).toBeTruthy();
  });
});

const tabButton = (label: string) => {
  const button = screen.getByText(label).closest("button");
  if (button === null) throw new Error(`No tab button for ${label}`);
  return button;
};

describe("TabStrip", () => {
  const tabs = [
    { kind: "overview" } as const,
    { kind: "captain_issues" } as const,
  ];

  it("renders each tab with its label and the open-a-tab button", () => {
    render(<TabStrip threadId="jam_1" tabs={tabs} activeId="overview" />);
    expect(tabButton("Overview")).toBeTruthy();
    expect(tabButton("Issues")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open a tab" })).toBeTruthy();
    expect(tabButton("Overview").hasAttribute("data-selected")).toBe(true);
  });

  it("selects on click and closes on the close button or a middle click", () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />,
    );
    fireEvent.click(tabButton("Issues"));
    expect(onSelectTab).toHaveBeenCalledWith("captain_issues");
    fireEvent.click(screen.getByRole("button", { name: "Close Overview" }));
    expect(onCloseTab).toHaveBeenCalledWith("overview");
    fireEvent(
      tabButton("Issues"),
      new MouseEvent("auxclick", { bubbles: true, button: 1 }),
    );
    expect(onCloseTab).toHaveBeenCalledWith("captain_issues");
  });

  it("keeps the close affordance out of the tab's own flow", () => {
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        onSelectTab={() => undefined}
        onCloseTab={() => undefined}
      />,
    );
    const close = screen.getByRole("button", { name: "Close Overview" });
    const holder = close.parentElement;
    // Capy overlays a 20 px close on the tab's right edge; the tab keeps its
    // label's width, so the control may not sit in the tab's flex flow.
    expect(holder?.className).toContain("absolute");
    expect(close.closest("[data-pane-tab] > button")).toBeNull();
  });

  it("puts the pinned chat tab first", () => {
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="chat"
        chatTab={{ title: "Acme", content: "Acme", onSelect: () => {} }}
      />,
    );
    const strip = document.querySelectorAll("[data-pane-tab]");
    expect(
      Array.from(strip).map((tab) => tab.getAttribute("data-pane-tab")),
    ).toEqual(["chat", "overview", "captain_issues"]);
  });

  it("carries the tab label in data-pane-tab-label, as Capy's strip does", () => {
    render(
      <TabStrip
        threadId="jam_1"
        tabs={tabs}
        activeId="overview"
        chatTab={{ title: "Acme", content: "Acme", onSelect: () => {} }}
      />,
    );
    const labels = ["overview", "captain_issues"].map((id) =>
      document
        .querySelector(`[data-pane-tab="${id}"] [data-pane-tab-label]`)
        ?.getAttribute("data-pane-tab-label"),
    );
    expect(labels).toEqual(["Overview", "Issues"]);
  });
});
