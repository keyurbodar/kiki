import { Atom } from "effect/reactivity";
import { AuthServiceMock } from "./mock.ts";

export const authRuntime = Atom.runtime(AuthServiceMock);
