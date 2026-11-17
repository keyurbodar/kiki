import { useMemo } from "react";
import { DiagramWindow, extractMermaidBlocks } from "@/components/markdown";
import { makeThreadFixtures } from "@/data/events";

type AgentMessage = {
  id: string;
  type: "agent-message";
  text: string;
  settled: boolean;
};

/**
 * The agent message a diagram window shows. Provisional: kiki has no
 * transcript atom yet (thread view core, WP B7), so this reads the A8 sample
 * transcript for the thread id. Swap for the transcript rows atom when it lands.
 */
function useAgentMessage(threadId: string, messageId: string) {
  return useMemo(
    () =>
      makeThreadFixtures({ jamId: threadId }).rows.find(
        (row): row is typeof row & AgentMessage =>
          row.type === "agent-message" && row.id === messageId,
      ),
    [threadId, messageId],
  );
}

export const openThreadFromDiagram = (threadId: string) => {
  const href = `/thread/${threadId}`;
  const opener = window.opener as Window | null;
  if (opener !== null && !opener.closed) {
    opener.postMessage(
      { type: "capy:open-thread", href },
      window.location.origin,
    );
    opener.focus();
    return;
  }
  window.open(href, "_blank");
};

export type DiagramWindowScreenProps = {
  threadId: string;
  messageId: string;
  index: number;
};

/** /diagram/$threadId/$messageId/$index: one mermaid block of an agent message in its own window. */
export function DiagramWindowScreen({
  threadId,
  messageId,
  index,
}: DiagramWindowScreenProps) {
  const message = useAgentMessage(threadId, messageId);
  const blocks =
    message === undefined ? [] : extractMermaidBlocks(message.text);
  const text = blocks[index];
  return (
    <DiagramWindow
      text={text}
      complete={message?.settled === true || index < blocks.length - 1}
      notFound={text === undefined}
      onOpenThread={() => openThreadFromDiagram(threadId)}
    />
  );
}
