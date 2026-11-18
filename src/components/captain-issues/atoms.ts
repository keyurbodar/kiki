import { Atom } from "effect/reactivity";
import {
  defaultIssueDisplay,
  type IssueDisplay,
} from "../issues-toolbar/issues-toolbar";
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

/** A pane row is one line: the state icon, the title and the age, as Capy's. */
export const defaultCaptainIssueDisplay: IssueDisplay = {
  ...defaultIssueDisplay,
  hidden: ["id", "priority", "labels", "relations", "pulls", "due", "assignee"],
};

export const captainIssueDisplayAtom = Atom.family((_jamId: string) =>
  Atom.make<IssueDisplay>(defaultCaptainIssueDisplay).pipe(Atom.keepAlive),
);
