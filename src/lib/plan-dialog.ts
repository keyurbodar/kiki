import { Atom } from "effect/reactivity";

export type PlanDialog = {
  dialog: "plan" | "paywall";
  recommended?: "lite" | "pro" | "max";
};

export const planDialogAtom = Atom.make<PlanDialog | null>(null).pipe(
  Atom.keepAlive,
);
