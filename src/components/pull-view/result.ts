import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";

export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));
