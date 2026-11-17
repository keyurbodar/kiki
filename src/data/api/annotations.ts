import { Context } from "effect";

export const InferredMethod = Context.Reference<boolean>(
  "kiki/api/InferredMethod",
  { defaultValue: () => false },
);
