import type { Project } from "@/data/api/schemas/project";

export type ThreadMessage = {
  text: string;
  mentions: ReadonlyArray<unknown>;
  files: ReadonlyArray<unknown>;
};

export type CreateJamOptions = {
  clientKey?: string;
  title?: string;
  slackChannelId?: string;
};

export const createJamRequest = (
  orgId: string,
  projectId: string | undefined,
  message: ThreadMessage,
  options: CreateJamOptions = {},
  id: () => string = () => crypto.randomUUID(),
) => {
  const jamId = `jam_${id()}`;
  const requestId = id();
  return {
    params: { orgId, projectId },
    payload: {
      jamId,
      requestId,
      title: options.title,
      message: message.text,
      files: message.files.length === 0 ? undefined : message.files,
      clientKey: options.clientKey ?? requestId,
      mentions: message.mentions.length === 0 ? undefined : message.mentions,
      slackChannelId: options.slackChannelId,
    },
    reactivityKeys: [`jam:${projectId ?? orgId}`, `jam:${orgId}`],
  };
};

export type CreateJamRequest = ReturnType<typeof createJamRequest>;

export type ToastError = (
  message: string,
  options?: { description?: string },
) => void;

export type StartThreadDeps = {
  orgId: string;
  projectId: string | undefined;
  needsProject: boolean;
  title?: string;
  slackChannelId?: string;
  ensureProject: (orgId: string) => Promise<Project>;
  saveVariables?: (projectId: string) => Promise<void>;
  create: (request: CreateJamRequest) => Promise<{ slack?: unknown }>;
  openThread: (jamId: string) => Promise<void>;
  backToNew: () => Promise<void>;
  keepDraft: (message: ThreadMessage) => void;
  clearDraft: () => void;
  toastError: ToastError;
};

const draftKept = { description: "Your draft was kept" };

const describe = (error: unknown) =>
  error instanceof Error && error.message !== ""
    ? { description: error.message }
    : undefined;

export async function startThread(
  deps: StartThreadDeps,
  message: ThreadMessage,
) {
  const project = deps.needsProject
    ? await deps.ensureProject(deps.orgId).catch(() => null)
    : undefined;
  if (project === null) {
    deps.keepDraft(message);
    deps.toastError("Could not start the thread", draftKept);
    return;
  }
  const projectId = project?.id ?? deps.projectId;
  if (deps.saveVariables !== undefined && projectId !== undefined) {
    try {
      await deps.saveVariables(projectId);
    } catch {
      deps.keepDraft(message);
      deps.toastError("Could not save the variables to the project", draftKept);
      return;
    }
  }
  const request = createJamRequest(deps.orgId, projectId, message, {
    title: deps.title,
    slackChannelId: deps.slackChannelId,
  });
  deps.clearDraft();
  const created = deps.create(request);
  created.catch(() => {});
  try {
    await deps.openThread(request.payload.jamId);
    const thread = await created;
    if (deps.slackChannelId !== undefined && thread.slack === null) {
      deps.toastError("Thread created, but Slack linking failed");
    }
  } catch (error) {
    deps.keepDraft(message);
    await deps.backToNew();
    deps.toastError("Failed to start thread", describe(error));
  }
}
