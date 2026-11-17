import { Schema, SchemaTransformation } from "effect";

export const UNSUPPORTED = "unsupported" as const;

const notKnown = (known: ReadonlyArray<string>) =>
  Schema.makeFilter<string>(
    (value) =>
      !known.includes(value) || `Known member with an invalid shape: ${value}`,
  );

/**
 * Capy's forward-compatible catch-all for a tagged union: an object whose tag
 * is not one of the known members decodes to `{ [tag]: "unsupported", of }`
 * instead of failing, so a newer server never breaks an older client.
 */
export const unsupportedTag = <
  const Tag extends string,
  Fields extends Schema.Struct.Fields = Record<never, never>,
>(
  tag: Tag,
  known: ReadonlyArray<string>,
  fields?: Fields,
) => {
  const base = fields ?? ({} as Fields);
  const from = Schema.Struct({
    ...base,
    [tag]: Schema.String.check(notKnown(known)),
  } as Fields & { [K in Tag]: Schema.String });
  const to = Schema.Struct({
    ...base,
    [tag]: Schema.Literal(UNSUPPORTED),
    of: Schema.String,
  } as Fields & { [K in Tag]: Schema.Literal<"unsupported"> } & {
    of: Schema.String;
  });
  return from
    .pipe(
      Schema.decodeTo(
        Schema.toType(to),
        SchemaTransformation.transform<
          Record<string, unknown>,
          Record<string, unknown>
        >({
          decode: (input) => ({ ...input, [tag]: UNSUPPORTED, of: input[tag] }),
          encode: ({ of, ...rest }) => ({ ...rest, [tag]: of }),
        }) as never,
      ),
    )
    .annotate({ identifier: "UnsupportedTag" });
};
