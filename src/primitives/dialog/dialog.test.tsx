import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogOverlayVariants,
  isPasswordManagerElement,
} from ".";

afterEach(cleanup);

function element(markup: string) {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  return host.firstElementChild?.firstElementChild ?? host.firstElementChild;
}

describe("isPasswordManagerElement", () => {
  it("matches injected password-manager elements and their descendants", () => {
    expect(
      isPasswordManagerElement(document.createElement("com-1password-button")),
    ).toBe(true);
    expect(
      isPasswordManagerElement(document.createElement("bitwarden-inline-menu")),
    ).toBe(true);
    expect(
      isPasswordManagerElement(
        document.createElement("keepassxc-password-field"),
      ),
    ).toBe(true);
    expect(
      isPasswordManagerElement(
        element('<div data-lastpass-icon-root=""><span></span></div>'),
      ),
    ).toBe(true);
    expect(
      isPasswordManagerElement(
        element('<form data-protonpass-form=""><input /></form>'),
      ),
    ).toBe(true);
  });

  it("ignores ordinary elements and non-elements", () => {
    expect(isPasswordManagerElement(document.createElement("button"))).toBe(
      false,
    );
    expect(
      isPasswordManagerElement(element('<div class="x"><span></span></div>')),
    ).toBe(false);
    expect(isPasswordManagerElement(null)).toBe(false);
    expect(isPasswordManagerElement(window)).toBe(false);
  });
});

function Archive(props: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={props.onOpenChange}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive this thread?</DialogTitle>
          <DialogDescription>Its machines stop.</DialogDescription>
        </DialogHeader>
        <DialogBody>Body</DialogBody>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens into the panel surface with every part slotted", async () => {
    render(<Archive />);
    const trigger = screen.getByText("Open");
    expect(trigger.dataset.slot).toBe("dialog-trigger");
    fireEvent.click(trigger);
    const title = await screen.findByText("Archive this thread?");
    expect(title.dataset.slot).toBe("dialog-title");
    expect(title.className).toContain("text-base");
    const content = title.closest<HTMLElement>("[data-slot=dialog-content]");
    expect(content?.className).toContain("rounded-(--radius-panel)");
    expect(content?.className).toContain("kiki-dialog");
    expect(content?.className).toContain("max-h-full");
    expect(content?.parentElement?.className).toContain("z-(--z-dialog)");
    expect(
      document.querySelector("[data-slot=dialog-overlay]")?.className,
    ).toContain("bg-overlay");
    expect(screen.getByText("Its machines stop.").dataset.slot).toBe(
      "dialog-description",
    );
    const body = screen.getByText("Body");
    expect(body.className).toContain("kiki-dialog-body");
    expect(body.dataset.spacing).toBe("base");
    expect(screen.getByText("Cancel").dataset.slot).toBe("dialog-close");
  });

  it("puts a Close button in the header that closes the dialog", async () => {
    const onOpenChange = vi.fn();
    render(<Archive onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Open"));
    const close = (await screen.findByText("Close")).closest("button");
    expect(close?.dataset.slot).toBe("dialog-close");
    expect(close?.className).toContain("text-icon-muted");
    fireEvent.click(close as HTMLButtonElement);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it("renders the child as the trigger with asChild", () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="custom">
            Link trigger
          </button>
        </DialogTrigger>
      </Dialog>,
    );
    const link = screen.getByText("Link trigger");
    expect(link.className).toBe("custom");
    expect(link.dataset.slot).toBe("dialog-trigger");
  });

  it("keeps children for an explicit render callback", () => {
    render(
      <Dialog>
        <DialogTrigger render={(props) => <button {...props} />}>
          Open
        </DialogTrigger>
      </Dialog>,
    );
    expect(screen.getByText("Open").dataset.slot).toBe("dialog-trigger");
  });

  it("renders a bare popup inside a portal for full-bleed dialogs", async () => {
    render(
      <Dialog defaultOpen>
        <DialogPortal>
          <DialogOverlay scrim="media" forceRender />
          <DialogPopup className="fixed inset-0 z-(--z-overlay-content)">
            Media
          </DialogPopup>
        </DialogPortal>
      </Dialog>,
    );
    const popup = await screen.findByText("Media");
    expect(popup.dataset.slot).toBe("dialog-content");
    expect(popup.className).toBe("fixed inset-0 z-(--z-overlay-content)");
    expect(popup.parentElement?.className ?? "").not.toContain(
      "z-(--z-dialog)",
    );
    expect(
      document.querySelector("[data-slot=dialog-overlay]")?.className,
    ).toContain("bg-overlay-media");
  });

  it("sizes the title and spaces the body", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle size="lg">Large</DialogTitle>
          <DialogBody spacing="relaxed">Relaxed</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Large").className).toContain("text-xl");
    const relaxed = screen.getByText("Relaxed");
    expect(relaxed.className).toContain("kiki-dialog-body");
    expect(relaxed.dataset.spacing).toBe("relaxed");
  });

  it("switches the overlay scrim", () => {
    expect(dialogOverlayVariants()).toContain("bg-overlay");
    expect(dialogOverlayVariants({ scrim: "media" })).toContain(
      "bg-overlay-media",
    );
    expect(dialogOverlayVariants({ scrim: "media" })).not.toMatch(
      /bg-overlay(\s|$)/,
    );
    render(
      <Dialog defaultOpen>
        <DialogOverlay scrim="media" className={() => "extra"} />
      </Dialog>,
    );
    const overlay = document.querySelector("[data-slot=dialog-overlay]");
    expect(overlay?.className).toContain("bg-overlay-media");
    expect(overlay?.className).toContain("extra");
  });
});
