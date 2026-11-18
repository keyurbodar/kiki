import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { threadMachinesAtom } from "@/data/atoms/setup";

export type TerminalPaneProps = {
  threadId: string;
  orgId?: OrgId | undefined;
};

const machineName = (rows: unknown): string | undefined => {
  if (!Array.isArray(rows)) return undefined;
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const name = (row as { name?: unknown }).name;
    if (typeof name === "string" && name !== "") return name;
  }
  return undefined;
};

/**
 * The terminal surface. Capy's is a live shell in the chat column; ours has no
 * session behind it, so the frame and the prompt are real and the transcript is
 * not — it says so instead of swallowing input into a fake prompt, which would
 * read as working and be nothing.
 */
export function TerminalPane({ threadId, orgId }: TerminalPaneProps) {
  const machines = useAtomValue(
    orgId === undefined
      ? threadMachinesAtom("" as never, threadId as JamId)
      : threadMachinesAtom(orgId, threadId as JamId),
  );
  const machine = AsyncResult.isSuccess(machines)
    ? machineName(machines.value)
    : undefined;
  const prompt = machine === undefined ? "~" : `${machine}:~`;
  return (
    <div
      data-slot="terminal-pane"
      data-thread={threadId}
      className="flex min-h-0 flex-1 flex-col overflow-auto bg-background px-3 py-2 font-(family-name:--font-terminal) text-xs/5"
    >
      <p data-slot="terminal-prompt" className="whitespace-pre-wrap">
        <span className="text-muted-foreground-2">{prompt}$</span>{" "}
        <span className="inline-block h-3.5 w-1.5 translate-y-0.5 bg-foreground" />
      </p>
      <p
        data-slot="terminal-note"
        className="mt-2 whitespace-pre-wrap text-muted-foreground-2"
      >
        No terminal session is attached to this thread in this build. Capy runs
        the shell on the thread&rsquo;s machine; nothing here accepts input.
      </p>
    </div>
  );
}
