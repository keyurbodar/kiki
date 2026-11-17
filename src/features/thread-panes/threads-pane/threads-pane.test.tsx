import { Menu } from "@base-ui/react/menu";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AllThreadsPage } from "./all-threads-page";
import { SideThreadsPage } from "./side-threads-page";

afterEach(cleanup);

function InMenu({ children }: { children: ReactNode }) {
  return (
    <Menu.Root open>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const search = (label: string, text: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });

describe("SideThreadsPage", () => {
  const sideThreads = [
    { id: "jam_a", label: "Stub the payment gateway" },
    { id: "jam_b", label: "Add a retry budget" },
  ];

  it("lists New side thread first with its shortcut, then the side threads", () => {
    const onNew = vi.fn();
    render(
      <InMenu>
        <SideThreadsPage
          sideThreads={sideThreads}
          onOpen={() => {}}
          onBack={() => {}}
          onNewSideThread={onNew}
          newSideThreadShortcut="⇧⌘S"
        />
      </InMenu>,
    );
    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);
    expect(items).toEqual([
      "Side threads",
      "New side thread⇧⌘S",
      "Stub the payment gateway",
      "Add a retry budget",
    ]);
    expect(screen.getByPlaceholderText("Search side threads")).toBeTruthy();
    fireEvent.click(screen.getByText("New side thread"));
    expect(onNew).toHaveBeenCalledOnce();
  });

  it("filters by the query and shows No matches", () => {
    const onOpen = vi.fn();
    render(
      <InMenu>
        <SideThreadsPage
          sideThreads={sideThreads}
          onOpen={onOpen}
          onBack={() => {}}
        />
      </InMenu>,
    );
    search("Search side threads", "retry");
    expect(screen.queryByText("Stub the payment gateway")).toBeNull();
    fireEvent.click(screen.getByText("Add a retry budget"));
    expect(onOpen).toHaveBeenCalledWith(sideThreads[1]);
    search("Search side threads", "zzz");
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("names the page when empty and goes back from the header", () => {
    const onBack = vi.fn();
    render(
      <InMenu>
        <SideThreadsPage sideThreads={[]} onOpen={() => {}} onBack={onBack} />
      </InMenu>,
    );
    expect(screen.getByText("No side threads")).toBeTruthy();
    fireEvent.click(screen.getByText("Side threads"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe("AllThreadsPage", () => {
  it("shows No all threads for an empty crew", () => {
    render(
      <InMenu>
        <AllThreadsPage threads={[]} onOpen={() => {}} onBack={() => {}} />
      </InMenu>,
    );
    expect(screen.getByPlaceholderText("Search threads")).toBeTruthy();
    expect(screen.getByText("No all threads")).toBeTruthy();
  });

  it("pages by 50 with Show more and matches titles and codes", () => {
    const threads = Array.from({ length: 60 }, (_, i) => ({
      id: `jam_${i}`,
      title: i === 0 ? null : `Thread ${i}`,
      code: `ACME-${i}`,
    }));
    render(
      <InMenu>
        <AllThreadsPage threads={threads} onOpen={() => {}} onBack={() => {}} />
      </InMenu>,
    );
    expect(screen.getByText("Untitled thread")).toBeTruthy();
    expect(screen.queryByText("Thread 55")).toBeNull();
    fireEvent.click(screen.getByText("Show more"));
    expect(screen.getByText("Thread 55")).toBeTruthy();
    expect(screen.queryByText("Show more")).toBeNull();
    search("Search threads", "acme-42");
    expect(screen.getByText("Thread 42")).toBeTruthy();
    expect(screen.queryByText("Thread 41")).toBeNull();
  });
});
