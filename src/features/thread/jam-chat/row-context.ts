import { createContext, useContext } from "react";
import type { RowGap } from "./row-gaps";

export type ChatRowContext = {
  gaps: ReadonlyMap<string, RowGap>;
  now?: number;
  jamId?: string;
};

export const RowContext = createContext<ChatRowContext>({ gaps: new Map() });

/**
 * The thread a row is painting in, for a row that has to read something the
 * thread owns (its project's Setup records). A transcript mounted without a
 * jamId reads nothing rather than guessing one.
 */
export const useTranscriptJamId = () => useContext(RowContext).jamId;
