import { Atom } from "effect/reactivity";
import {
  type CaptainIssueFilters,
  defaultCaptainIssueFilters,
} from "./filters";

export type CaptainIssueSearch = { text: string; open: boolean };

export const captainIssueFiltersAtom = Atom.family((_jamId: string) =>
  Atom.make<CaptainIssueFilters>(defaultCaptainIssueFilters).pipe(
    Atom.keepAlive,
  ),
);

export const captainIssueSearchAtom = Atom.family((_jamId: string) =>
  Atom.make<CaptainIssueSearch>({ text: "", open: false }).pipe(Atom.keepAlive),
);
