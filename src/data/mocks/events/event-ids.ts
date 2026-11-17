/** Crockford base32: the alphabet Capy's ULID event ids use. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const base32 = (value: number, length: number) => {
  let output = "";
  let rest = value;
  for (let index = 0; index < length; index += 1) {
    output = ALPHABET[rest % 32] + output;
    rest = Math.floor(rest / 32);
  }
  return output;
};

/**
 * A deterministic 26-character event id for a seeded row: ten base-32 time
 * digits, a two-digit thread slot and a fourteen-digit sequence. Sorting the
 * ids therefore sorts by creation time, which is what the event page cursor,
 * the stream's `after` filter and the timeline's merge all rely on.
 */
export const eventId = (
  at: Date | number | string,
  sequence: number,
  thread = 0,
) => {
  const ms = typeof at === "number" ? at : Date.parse(String(at));
  if (!Number.isFinite(ms))
    throw new TypeError(`eventId: expected a timestamp, got ${String(at)}`);
  return base32(ms, 10) + base32(thread, 2) + base32(sequence, 14);
};
