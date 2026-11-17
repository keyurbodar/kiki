import { Effect, Schema } from "effect";

export const withDefault =
  <const A>(value: A) =>
  <S extends Schema.Top>(
    schema: S & ([A] extends [S["Encoded"]] ? unknown : never),
  ) =>
    schema.pipe(
      Schema.withDecodingDefault(Effect.succeed(value as S["Encoded"])),
    );
