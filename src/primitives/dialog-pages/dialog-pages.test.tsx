import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent } from "@/primitives/dialog";
import { DialogPage, type DialogPageSpec, DialogPages } from ".";

afterEach(cleanup);

const pages: Record<"list" | "detail", DialogPageSpec> = {
  list: { title: "Members", body: "Member list" },
  detail: {
    title: "Invite",
    body: "Invite form",
    spacing: "relaxed",
    bodyClassName: "items-center",
    footer: <button type="button">Send</button>,
    footerClassName: "justify-between",
  },
};

function renderPages(
  page: "list" | "detail",
  onBack = vi.fn(),
  backDisabled = false,
) {
  render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogPages
          page={page}
          root="list"
          pages={pages}
          onBack={onBack}
          backDisabled={backDisabled}
        />
      </DialogContent>
    </Dialog>,
  );
  return onBack;
}

describe("DialogPages", () => {
  it("shows the root page without a Back button or footer", () => {
    renderPages("list");
    const title = screen.getByText("Members");
    expect(title.className).toContain("truncate");
    expect(title.closest("[data-slot=dialog-title]")?.className).toContain(
      "flex items-center gap-1",
    );
    expect(screen.queryByLabelText("Back")).toBeNull();
    expect(screen.getByText("Member list").dataset.slot).toBe("dialog-body");
    expect(document.querySelector("[data-slot=dialog-footer]")).toBeNull();
  });

  it("adds Back, the page body options and a bordered footer on inner pages", () => {
    const onBack = renderPages("detail");
    fireEvent.click(screen.getByLabelText("Back"));
    expect(onBack).toHaveBeenCalledOnce();
    const body = screen.getByText("Invite form");
    expect(body.className).toContain("gap-4 py-5");
    expect(body.className).toContain("items-center");
    const footer = screen.getByText("Send").parentElement;
    expect(footer?.dataset.slot).toBe("dialog-footer");
    expect(footer?.className).toContain(
      "border-t-hairline border-border-1 pt-4",
    );
    expect(footer?.className).toContain("justify-between");
  });

  it("disables Back while backDisabled", () => {
    const onBack = renderPages("detail", vi.fn(), true);
    const back = screen.getByLabelText("Back") as HTMLButtonElement;
    expect(back.disabled).toBe(true);
    fireEvent.click(back);
    expect(onBack).not.toHaveBeenCalled();
  });
});

it("forwards div attributes to the pages wrapper", () => {
  render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogPages
          aria-label="Invite flow"
          page="list"
          root="list"
          pages={pages}
          onBack={() => {}}
        />
      </DialogContent>
    </Dialog>,
  );
  const wrapper = document.querySelector<HTMLElement>(
    "[data-slot=dialog-pages]",
  );
  expect(wrapper?.getAttribute("aria-label")).toBe("Invite flow");
  expect(wrapper?.className).toBe("contents");
});

describe("DialogPage", () => {
  it("remounts its page when the key changes", () => {
    const { rerender } = render(<DialogPage pageKey="a">A</DialogPage>);
    const first = screen.getByText("A");
    expect(first.parentElement?.dataset.slot).toBe("dialog-page");
    rerender(<DialogPage pageKey="b">A</DialogPage>);
    expect(screen.getByText("A")).not.toBe(first);
  });

  it("pins its height to the measured page", () => {
    render(<DialogPage pageKey="a">A</DialogPage>);
    const outer = screen.getByText("A").parentElement as HTMLElement;
    expect(outer.style.height).toBe("0px");
  });
});
