import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyMachineFileDialog } from "./copy-machine-file-dialog";
import {
  canCopyFile,
  copyBody,
  drivePathExists,
  formattedBytes,
  isForeignMachinePath,
  isPreviewable,
  isValidDrivePath,
  machineMissCopy,
  relativePath,
  suggestedDrivePath,
  trimTrailingSlashes,
} from "./logic";
import { MachinePathBody } from "./machine-path-view";
import { MachineFileMiss, MachinePathUnavailable } from "./machine-states";
import {
  parseDriveEntries,
  parseFileContent,
  parseMachineFile,
  parseWriteResult,
} from "./parse";

afterEach(cleanup);

const file = {
  path: "/workspace/src/app.ts",
  sha: "sha_1",
  content: {
    content: "export const app = 1;",
    contentBase64: undefined,
    binary: false,
    truncated: false,
    sizeBytes: 21,
    mediaType: "text/plain",
  },
};

describe("machine path heuristics", () => {
  it("recognises paths left by a cloud machine or a device", () => {
    expect(isForeignMachinePath("/home/user/project/file.ts", true)).toBe(true);
    expect(isForeignMachinePath("C:\\src\\file.ts", false)).toBe(true);
    expect(isForeignMachinePath("\\\\host\\share", false)).toBe(true);
    expect(isForeignMachinePath("/Users/alice/file.ts", false)).toBe(true);
    expect(isForeignMachinePath("/workspace/file.ts", false)).toBe(false);
    expect(machineMissCopy("/workspace/file.ts", false)).toEqual({
      line: "File isn't on this machine",
      sub: "It was deleted, moved, or written on another machine",
    });
    expect(machineMissCopy("/home/user/file.ts", true)).toEqual({
      line: "File is on another machine",
      sub: "This path is from the cloud machine this thread used before",
    });
    expect(machineMissCopy("C:\\src\\file.ts", false).sub).toBe(
      "This path is from a device this thread used before",
    );
  });

  it("rebases paths under the workspace root", () => {
    expect(trimTrailingSlashes("/workspace/app///")).toBe("/workspace/app");
    expect(relativePath("/workspace/app/src/a.ts", "/workspace/app/")).toBe(
      "/src/a.ts",
    );
    expect(relativePath("/tmp/a.ts", "/workspace/app")).toBe("tmp/a.ts");
  });

  it("validates copy paths against Capy's rules", () => {
    expect(isValidDrivePath(suggestedDrivePath("app.ts"))).toBe(true);
    expect(isValidDrivePath("copies//app.ts")).toBe(false);
    expect(isValidDrivePath("copies/../app.ts")).toBe(false);
    expect(isValidDrivePath(" copies/app.ts")).toBe(false);
    expect(isValidDrivePath("")).toBe(false);
    expect(drivePathExists([{ path: "copies/app.ts" }], "copies/app.ts")).toBe(
      true,
    );
  });

  it("only offers complete copies", () => {
    expect(canCopyFile(file)).toBe(true);
    expect(copyBody(file)).toEqual({
      kind: "text",
      content: "export const app = 1;",
    });
    expect(canCopyFile({ ...file, sha: null })).toBe(false);
    expect(
      canCopyFile({ ...file, content: { ...file.content, truncated: true } }),
    ).toBe(false);
    expect(
      canCopyFile({
        ...file,
        content: { ...file.content, content: undefined, contentBase64: "AAA=" },
      }),
    ).toBe(true);
    expect(
      copyBody({
        ...file,
        content: { ...file.content, contentBase64: "AAA=" },
      }),
    ).toEqual({
      kind: "base64",
      contentBase64: "AAA=",
    });
  });

  it("gates previews and formats sizes", () => {
    expect(isPreviewable(parseMachineFile(file), "app.ts", 21)).toBe(true);
    expect(isPreviewable(parseMachineFile(file), "app.ts", 512 * 1024)).toBe(
      false,
    );
    expect(isPreviewable(parseMachineFile(file), "app.bin", 21)).toBe(false);
    expect(formattedBytes(512)).toBe("512 B");
    expect(formattedBytes(2048)).toBe("2 KB");
    expect(formattedBytes(-1)).toBe("0 B");
  });
});

describe("defensive parsing", () => {
  it("reads a machine file and marks missing content", () => {
    expect(parseMachineFile(file).sha).toBe("sha_1");
    expect(parseMachineFile({ content: null }).content).toBeNull();
    expect(parseFileContent({ base64: "AAA=", size: 3 }).contentBase64).toBe(
      "AAA=",
    );
    expect(
      parseDriveEntries({ items: [{ path: "copies/app.ts" }, {}] }),
    ).toEqual([{ path: "copies/app.ts" }]);
    expect(parseWriteResult({ oid: "sha_2" })).toBe("sha_2");
  });
});

describe("states and dialog", () => {
  it("renders exact miss and unavailable copy", () => {
    render(
      <MachineFileMiss
        path="/workspace/app.ts"
        device={false}
        onOpenDiffs={vi.fn()}
      />,
    );
    expect(screen.getByText("File isn't on this machine")).toBeTruthy();
    expect(screen.getByText("Open diffs")).toBeTruthy();
    cleanup();
    render(<MachinePathUnavailable onRetry={vi.fn()} />);
    expect(screen.getByText("Machine is unreachable")).toBeTruthy();
    expect(
      screen.getByText("Copy to Drive needs a complete read of this file"),
    ).toBeTruthy();
    expect(
      screen.getByText("Connect the machine or wake it to read the file first"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("renders loading, unavailable and empty body states", () => {
    const onRetry = vi.fn();
    const { container } = render(
      <MachinePathBody
        path="/workspace/app.ts"
        file={undefined}
        loading
        unreachable={false}
        onRetry={onRetry}
        onCopy={vi.fn()}
      />,
    );
    expect(
      container.querySelector('[data-slot="machine-path-loading"]'),
    ).not.toBeNull();
    cleanup();
    render(
      <MachinePathBody
        path="/workspace/app.ts"
        file={undefined}
        loading={false}
        unreachable
        onRetry={onRetry}
        onCopy={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Machine unavailable, showing the last read"),
    ).toBeTruthy();
    expect(screen.getByText("Machine is unreachable")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    expect(onRetry).toHaveBeenCalled();
    cleanup();
    render(
      <MachinePathBody
        path="/workspace/app.ts"
        file={parseMachineFile({ content: null })}
        loading={false}
        unreachable={false}
        onRetry={onRetry}
        onCopy={vi.fn()}
      />,
    );
    expect(screen.getByText("File isn't on this machine")).toBeTruthy();
  });

  it("copies to a validated Drive path and toasts on success", async () => {
    const onCopy = vi.fn(async () => {});
    const onClose = vi.fn();
    render(
      <CopyMachineFileDialog
        name="app.ts"
        body={{ kind: "text", content: "hello" }}
        driveEntries={[]}
        onRetryDrive={vi.fn()}
        onCopy={onCopy}
        onClose={onClose}
      />,
    );
    expect(
      screen.getByText(
        "Save a copy to My Drive without changing the machine file",
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "copies/app.ts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Copy to Drive" }));
    await vi.waitFor(() =>
      expect(onCopy).toHaveBeenCalledWith("copies/app.ts", {
        kind: "text",
        content: "hello",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("rejects an existing path and shows the Drive unavailable state", () => {
    const onRetryDrive = vi.fn();
    const { unmount } = render(
      <CopyMachineFileDialog
        name="app.ts"
        body={{ kind: "text", content: "hello" }}
        driveEntries={[{ path: "copies/app.ts" }]}
        onRetryDrive={onRetryDrive}
        onCopy={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("This path already exists")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Copy to Drive",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    unmount();
    render(
      <CopyMachineFileDialog
        name="app.ts"
        body={{ kind: "text", content: "hello" }}
        driveEntries={undefined}
        driveUnavailable
        onRetryDrive={onRetryDrive}
        onCopy={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Drive unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryDrive).toHaveBeenCalled();
  });
});
