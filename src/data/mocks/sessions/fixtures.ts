import { threads } from "../fixtures/world.ts";

/** One browser or terminal session a thread opened. */
export type ThreadSession = {
  readonly id: string;
  readonly threadId: string;
  readonly kind: "browser" | "terminal";
  readonly status: "starting" | "running" | "stopped";
  readonly createdAt: string;
  /** A browser session's current address; absent for a terminal. */
  readonly url?: string;
  /** A terminal session's machine and client, which is what its tab id carries. */
  readonly machineId?: string;
  readonly clientId?: string;
};

/**
 * The sessions the measured thread has open, so the two session-scoped tab ids
 * resolve to a record instead of to an id something invented on read. Every
 * other thread has none: an absent session is answered as absent.
 */
export const seedSessions: ReadonlyArray<ThreadSession> = [
  {
    id: "tab_01M7P7BROWSER0000000000AA",
    threadId: threads.captureProbe.id,
    kind: "browser",
    status: "running",
    createdAt: "2026-11-18T00:20:00.000Z",
  },
  {
    id: "tab_01M7P7TERMINAL000000000BB",
    threadId: threads.captureProbe.id,
    kind: "terminal",
    status: "running",
    createdAt: "2026-11-18T00:26:00.000Z",
    machineId: "machine_01M7FJEW1V6FAM4J6Z4S4RQSWD",
    clientId: "cl_01M7P7TERMINAL00000000CC",
  },
];
