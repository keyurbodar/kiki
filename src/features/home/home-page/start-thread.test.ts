import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/data/api/schemas/project";
import { createJamRequest, startThread, type StartThreadDeps } from "./start-thread";

const project = { id: "proj_home", repos: [], deleted: false } as unknown as Project;
const message = { text: "Hello", mentions: [], files: [] };

const deps = (overrides: Partial<StartThreadDeps> = {}) => {
  const created: Array<{ jamId: string }> = [];
  const base = {
    orgId: "org_sample",
    projectId: "proj_1",
    needsProject: false,
    ensureProject: vi.fn(async () => project),
    create: vi.fn(async (request: { payload: { jamId: string } }) => {
      created.push({ jamId: request.payload.jamId });
      return { slack: {} };
    }),
    openThread: vi.fn(async () => {}),
    backToNew: vi.fn(async () => {}),
    keepDraft: vi.fn(),
    clearDraft: vi.fn(),
    toastError: vi.fn(),
    created,
  };
  return { ...base, ...overrides, created };
};

describe("createJamRequest", () => {
  it("builds a create request with stable client keys and reactivity keys", () => {
    let n = 0;
    const request = createJamRequest(
      "org_sample",
      "proj_1",
      message,
      { title: "Draft" },
      () => `id${++n}`,
    );
    expect(request.payload.jamId).toBe("jam_id1");
    expect(request.payload.clientKey).toBe("id2");
    expect(request.payload.title).toBe("Draft");
    expect(request.payload.mentions).toBeUndefined();
    expect(request.reactivityKeys).toEqual([
      "jam:proj_1",
      "jam:org_sample",
    ]);
  });

  it("falls back to the org when there is no project", () => {
    const request = createJamRequest("org_sample", undefined, message);
    expect(request.reactivityKeys[0]).toBe("jam:org_sample");
  });
});

describe("startThread", () => {
  it("opens the thread and clears the draft", async () => {
    const d = deps();
    await startThread(d, message);
    expect(d.create).toHaveBeenCalledTimes(1);
    expect(d.openThread).toHaveBeenCalledTimes(1);
    expect(d.clearDraft).toHaveBeenCalled();
    expect(d.toastError).not.toHaveBeenCalled();
  });

  it("creates the Home project first when none is chosen", async () => {
    const d = deps({ projectId: undefined, needsProject: true });
    await startThread(d, message);
    expect(d.ensureProject).toHaveBeenCalledWith("org_sample");
    expect(d.create).toHaveBeenCalledTimes(1);
  });

  it("keeps the draft and reports when the project cannot be created", async () => {
    const d = deps({
      projectId: undefined,
      needsProject: true,
      ensureProject: vi.fn(async () => {
        throw new Error("nope");
      }),
    });
    await startThread(d, message);
    expect(d.create).not.toHaveBeenCalled();
    expect(d.keepDraft).toHaveBeenCalledWith(message);
    expect(d.toastError).toHaveBeenCalledWith("Could not start the thread", {
      description: "Your draft was kept",
    });
  });

  it("keeps the draft when the project variables cannot be saved", async () => {
    const d = deps({
      saveVariables: vi.fn(async () => {
        throw new Error("nope");
      }),
    });
    await startThread(d, message);
    expect(d.create).not.toHaveBeenCalled();
    expect(d.toastError).toHaveBeenCalledWith(
      "Could not save the variables to the project",
      { description: "Your draft was kept" },
    );
  });

  it("returns to the composer and reports the failure", async () => {
    const d = deps({
      openThread: vi.fn(async () => {
        throw new Error("Network down");
      }),
    });
    d.create.mockImplementationOnce(async () => {
      throw new Error("Network down");
    });
    await startThread(d, message);
    expect(d.backToNew).toHaveBeenCalled();
    expect(d.keepDraft).toHaveBeenCalledWith(message);
    expect(d.toastError).toHaveBeenCalledWith("Failed to start thread", {
      description: "Network down",
    });
  });

  it("reports a Slack linking failure after the thread opens", async () => {
    const d = deps({
      slackChannelId: "C123",
      create: vi.fn(async () => ({ slack: null })),
    });
    await startThread(d, message);
    expect(d.toastError).toHaveBeenCalledWith(
      "Thread created, but Slack linking failed",
    );
  });
});
