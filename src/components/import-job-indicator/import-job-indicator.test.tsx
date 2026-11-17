import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createImportJobStore,
  type ImportJob,
  ImportJobContext,
  type ImportSessionProgress,
  importJobProgress,
  startImportJob,
} from "./import-job";
import { ImportJobIndicator } from "./import-job-indicator";

afterEach(cleanup);

const input = { orgId: "org_acme", userId: "user_alex", placements: [] };

const job = (overrides: Partial<ImportJob> = {}): ImportJob => ({
  total: 4,
  done: 1,
  failed: 1,
  running: true,
  imported: [],
  input,
  progress: new Map(),
  ...overrides,
});

describe("importJobProgress", () => {
  it("counts done and failed sessions as settled", () => {
    expect(importJobProgress({ done: 1, failed: 1, total: 4 })).toEqual({
      settled: 2,
      fraction: 0.5,
    });
  });

  it("stays at zero for an empty job and caps at one", () => {
    expect(importJobProgress({ done: 0, failed: 0, total: 0 }).fraction).toBe(
      0,
    );
    expect(importJobProgress({ done: 3, failed: 2, total: 4 }).fraction).toBe(
      1,
    );
  });
});

describe("ImportJobIndicator", () => {
  it("renders nothing without a running job", () => {
    const { container } = render(<ImportJobIndicator />);
    expect(container.innerHTML).toBe("");
    render(<ImportJobIndicator job={job({ running: false })} />);
    expect(screen.queryByText("Importing threads")).toBeNull();
  });

  it("shows the label and spoken progress for a running job", () => {
    render(<ImportJobIndicator job={job()} className="ml-auto" />);
    const trigger = screen.getByLabelText("Importing threads, 2 of 4 done");
    expect(trigger.className).toContain("ml-auto");
    expect(screen.getByText("Importing threads")).toBeTruthy();
  });

  it("reads the job from context", () => {
    const store = createImportJobStore(job({ done: 3, failed: 0 }));
    render(
      <ImportJobContext value={store}>
        <ImportJobIndicator />
      </ImportJobContext>,
    );
    expect(
      screen.getByLabelText("Importing threads, 3 of 4 done"),
    ).toBeTruthy();
    act(() => store.set(undefined));
    expect(screen.queryByText("Importing threads")).toBeNull();
  });
});

describe("startImportJob", () => {
  const sessions = [
    { source: "codex", sessionId: "a" },
    { source: "codex", sessionId: "b" },
  ];

  const fakeRunner = () => {
    let listener: (progress: ImportSessionProgress) => void = () => {};
    let resolve: (value: { ok: true } | { ok: false; detail: string }) => void =
      () => {};
    return {
      emit: (sessionId: string, phase: string) =>
        listener({ sessionId, phase, pages: 1, events: 1, total: 1 }),
      finish: (value: { ok: true } | { ok: false; detail: string }) =>
        resolve(value),
      runner: {
        run: () =>
          new Promise<{ ok: true } | { ok: false; detail: string }>((r) => {
            resolve = r;
          }),
        subscribeProgress: (
          next: (progress: ImportSessionProgress) => void,
        ) => {
          listener = next;
          return () => {
            listener = () => {};
          };
        },
      },
    };
  };

  it("counts progress events and settles when every session reports", async () => {
    const store = createImportJobStore();
    const fake = fakeRunner();
    startImportJob(store, fake.runner, input, sessions);
    expect(store.get()).toMatchObject({ total: 2, done: 0, running: true });
    fake.emit("import:codex:a", "pages");
    fake.emit("import:codex:a", "done");
    fake.emit("import:codex:a", "done");
    fake.emit("import:codex:b", "failed");
    expect(store.get()).toMatchObject({ done: 1, failed: 1, running: true });
    fake.finish({ ok: true });
    await vi.waitFor(() => expect(store.get()?.running).toBe(false));
  });

  it("marks unreported sessions failed with the run's detail", async () => {
    const store = createImportJobStore();
    const fake = fakeRunner();
    startImportJob(store, fake.runner, input, sessions);
    fake.emit("import:codex:a", "done");
    fake.finish({ ok: false, detail: "Desktop app closed" });
    await vi.waitFor(() => expect(store.get()?.running).toBe(false));
    expect(store.get()).toMatchObject({ done: 1, failed: 1 });
    expect(store.get()?.progress.get("import:codex:b")).toMatchObject({
      phase: "failed",
      detail: "Desktop app closed",
    });
  });
});
