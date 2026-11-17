import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FileRef } from "@/data/events";
import {
  AttachmentGallery,
  AudioTranscript,
  copyAudioAddress,
} from "./attachment-gallery";
import {
  type AttachmentSource,
  AttachmentSourceProvider,
  type AttachmentUrl,
} from "./attachment-source";

const successUrl = "data:image/png;base64,AAAA";

const successSource: AttachmentSource = {
  useUrl: () => ({
    url: successUrl,
    failed: false,
    waiting: false,
    mediaFailed: () => {},
    refresh: () => {},
  }),
};

const failingSource: AttachmentSource = {
  useUrl: () => ({
    url: undefined,
    failed: true,
    waiting: false,
    mediaFailed: () => {},
    refresh: () => {},
  }),
};

const file = (overrides: Partial<FileRef> = {}): FileRef => ({
  fileId: "file_1",
  name: "photo.png",
  mediaType: "image/png",
  sizeBytes: 2048,
  width: 640,
  height: 480,
  ...overrides,
});

const image = (index: number, overrides: Partial<FileRef> = {}) => ({
  file: file({
    fileId: `file_${index}`,
    name: `photo-${index}.png`,
    ...overrides,
  }),
});

const renderGallery = (
  props: React.ComponentProps<typeof AttachmentGallery>,
  source: AttachmentSource = successSource,
) =>
  render(
    <AttachmentSourceProvider source={source}>
      <AttachmentGallery {...props} />
    </AttachmentSourceProvider>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("renders nothing for empty entries", () => {
  const { container } = renderGallery({ entries: [] });
  expect(container.firstChild).toBeNull();
});

it("renders one image as a preview button", () => {
  renderGallery({ entries: [image(1)] });
  expect(
    screen.getByRole("button", { name: "Preview photo-1.png" }),
  ).toBeTruthy();
});

it("limits a five-image gallery to four tiles and shows +1", () => {
  renderGallery({
    entries: [image(1), image(2), image(3), image(4), image(5)],
  });
  expect(screen.getAllByRole("button", { name: /^Preview / })).toHaveLength(4);
  expect(screen.getByText("+1")).toBeTruthy();
});

describe("file attachments", () => {
  const notes = {
    file: file({
      fileId: "file_6",
      name: "notes.pdf",
      mediaType: "application/pdf",
    }),
  };

  it("offers a download by default", () => {
    renderGallery({ entries: [notes] });
    expect(
      screen.getByRole("button", { name: "Download notes.pdf" }),
    ).toBeTruthy();
  });

  it("opens the file through onOpenFile when supplied", () => {
    const onOpenFile = vi.fn();
    renderGallery({ entries: [notes], onOpenFile });
    fireEvent.click(screen.getByRole("button", { name: "Open notes.pdf" }));
    expect(onOpenFile).toHaveBeenCalledTimes(1);
    expect(onOpenFile.mock.calls[0]?.[0]).toMatchObject(notes);
  });
});

describe("audio attachments", () => {
  const memo = {
    file: file({
      fileId: "file_7",
      name: "memo.m4a",
      mediaType: "audio/mp4",
      transcript: "Sample transcript",
    }),
  };

  it("renders a disabled play button until metadata loads, plus the options trigger", () => {
    renderGallery({ entries: [memo] });
    expect(
      (
        screen.getByRole("button", {
          name: "Play memo.m4a",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "memo.m4a options" }),
    ).toBeTruthy();
  });

  it("shows Unavailable when the source fails", () => {
    renderGallery({ entries: [memo] }, failingSource);
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Play memo.m4a",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

describe("compact variant", () => {
  const entries = [image(1), image(2)];

  it("renders compact preview cards", () => {
    renderGallery({ entries, variant: "compact" });
    expect(
      screen.getByRole("button", { name: "Preview photo-1.png" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Preview photo-2.png" }),
    ).toBeTruthy();
  });

  it("renders busy cards while pending", () => {
    renderGallery({
      entries: [{ ...entries[0], title: "Pending" }],
      variant: "compact",
      pending: true,
    });
    expect(
      screen
        .getByText("Pending")
        .closest("[aria-busy]")
        ?.getAttribute("aria-busy"),
    ).toBe("true");
  });
});

it("toggles an audio transcript", () => {
  render(<AudioTranscript label="memo.m4a" text="Sample transcript" />);
  const toggle = screen.getByRole("button", {
    name: "Expand transcript of memo.m4a",
  });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  const expanded = screen.getByRole("button", {
    name: "Collapse transcript of memo.m4a",
  });
  expect(expanded.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Sample transcript")).toBeTruthy();
});

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));

describe("copyAudioAddress", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("reports success after copying", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const copied = copyAudioAddress("https://example.test/memo.m4a");
    expect(writeText).toHaveBeenCalledWith("https://example.test/memo.m4a");
    await copied;
    expect(toast.success).toHaveBeenCalledWith("Audio address copied");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports an error when copying is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const copied = copyAudioAddress("https://example.test/memo.m4a");
    await copied;
    expect(toast.error).toHaveBeenCalledWith("Could not copy audio address");
    expect(toast.success).not.toHaveBeenCalled();
  });
});

it("source fixture exposes a usable URL and failure state", () => {
  const url: AttachmentUrl = successSource.useUrl(file(), "gallery");
  expect(url).toMatchObject({ url: successUrl, failed: false, waiting: false });
  expect(failingSource.useUrl(file(), "gallery").failed).toBe(true);
  const fixture = document.createElement("div");
  expect(within(fixture).queryByText("unreachable")).toBeNull();
});
