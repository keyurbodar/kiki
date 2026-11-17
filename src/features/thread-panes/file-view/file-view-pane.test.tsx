import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileViewPaneBody } from "./file-view-pane";

const home = { kind: "machine", jamId: "jam_sample", name: "Machine" } as const;

afterEach(cleanup);

describe("FileViewPaneBody", () => {
  it("asks to retry when the machine is missing", () => {
    const onRetryMachine = vi.fn();
    render(
      <FileViewPaneBody
        path="src/main.ts"
        home={home}
        read={{ status: "loading" }}
        machine="missing"
        onRetryMachine={onRetryMachine}
      />,
    );
    expect(
      screen.getByText("Couldn't find the machine that holds this file"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryMachine).toHaveBeenCalledOnce();
  });

  it("shows the failed state with a retry", () => {
    const onRetry = vi.fn();
    render(
      <FileViewPaneBody
        path="src/main.ts"
        home={home}
        read={{ status: "failed" }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("File unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("explains a file that is not on the machine", () => {
    render(
      <FileViewPaneBody
        path="src/gone.ts"
        home={home}
        read={{ status: "ready", file: { content: null } }}
      />,
    );
    expect(screen.getByText("File isn't on this machine")).toBeTruthy();
  });

  it("offers no preview for binaries and gates large files", () => {
    const { unmount } = render(
      <FileViewPaneBody
        path="bin/tool"
        home={home}
        read={{
          status: "ready",
          file: { content: { binary: true, sizeBytes: 10 } },
        }}
      />,
    );
    expect(screen.getByText("No preview for this file")).toBeTruthy();
    unmount();
    render(
      <FileViewPaneBody
        path="logs/big.log"
        home={home}
        read={{
          status: "ready",
          file: { content: { content: "x", sizeBytes: 5e6 } },
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Load anyway" })).toBeTruthy();
  });
});
