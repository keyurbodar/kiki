import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles.css";
import type { FileId } from "@/data/api/schemas/files";
import type { FileRef } from "@/data/events";
import { AgentMessage } from "@/features/thread/agent-message";
import {
  type AttachmentSource,
  AttachmentSourceProvider,
} from "@/features/thread/attachment-gallery/attachment-source";
import { MessageActionsProvider } from "@/features/thread/message-footer";
import { applyColorMode } from "@/tokens/theme";
import { UserMessage, type UserMessageRow } from "../user-message";
import fourUrl from "./samples/four.png";
import oneUrl from "./samples/one.png";
import threeUrl from "./samples/three.png";
import twoUrl from "./samples/two.png";

/*
 * Dev-only harness (not a route, not in the build): open
 * /src/features/thread/user-message/preview/index.html?state=<state>&scheme=<dark|light>
 * on a dev server. States: own, other, agent, files, single. Every sample is
 * generated art, not a capture.
 */

const shot = (
  id: string,
  name: string,
  width: number,
  height: number,
): FileRef => ({
  fileId: `file_${id}` as FileId,
  name,
  mediaType: "image/png",
  sizeBytes: 218_112,
  width,
  height,
});

const one = shot("one", "overview.png", 960, 540);
const two = shot("two", "canvas.png", 960, 540);
const three = shot("three", "settings.png", 720, 720);
const four = shot("four", "thread.png", 540, 960);
const brief: FileRef = {
  fileId: "file_brief" as FileId,
  name: "brief.pdf",
  mediaType: "application/pdf",
  sizeBytes: 64_512,
};

const urls: Record<string, string> = {
  file_one: oneUrl,
  file_two: twoUrl,
  file_three: threeUrl,
  file_four: fourUrl,
};

const sampleSource: AttachmentSource = {
  useUrl: (file) => {
    const url = urls[file.fileId];
    return {
      url,
      failed: url === undefined && file.fileId !== "file_brief",
      waiting: false,
      mediaFailed: () => {},
      refresh: () => {},
    };
  },
};

const now = new Date(2026, 10, 17, 14, 30);

const userRow = (files: ReadonlyArray<FileRef>): UserMessageRow =>
  ({
    id: "row_user",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: now,
    type: "user-message",
    text: "Here are the frames from the capture pass. The gallery sits above the bubble, the grid keeps its own aspect and the lightbox opens on the clicked tile.",
    mentions: [],
    files,
    delivery: "queue",
    actor: { type: "user", userId: "user_sample" },
    origin: { type: "web" },
    showOrigin: false,
    state: "answered",
  }) as unknown as UserMessageRow;

const agentRow = {
  id: "row_agent",
  eventId: "01JBBBBBBBBBBBBBBBBBBBBBBB",
  createdAt: now,
  type: "agent-message",
  settled: true,
  interrupted: false,
  turnCloses: true,
  text: "Two shots from the render pass, both at the frame's own aspect.",
  files: [
    { file: one, title: "Gallery, four up" },
    { file: three, title: "Settings, square" },
  ],
  uploads: [],
  placed: [],
  placing: [],
  modelId: "sample-model",
} as never;

const params = new URLSearchParams(location.search);
applyColorMode(params.get("scheme") === "light" ? "light" : "dark");

const state = params.get("state") ?? "own";

const states: Record<string, React.ReactNode> = {
  own: <UserMessage row={userRow([one, two, three, four])} />,
  other: <UserMessage row={userRow([one, brief])} />,
  agent: <AgentMessage row={agentRow} />,
  files: <UserMessage row={userRow([brief])} />,
  single: <UserMessage row={userRow([one])} />,
};

function Harness() {
  return (
    <MessageActionsProvider value={{ viewerUserId: "user_sample" }}>
      <AttachmentSourceProvider source={sampleSource}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6">
          <p className="text-2xs text-muted-foreground-2">
            message attachments · {state}
          </p>
          {states[state] ?? states.own}
        </div>
      </AttachmentSourceProvider>
    </MessageActionsProvider>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
