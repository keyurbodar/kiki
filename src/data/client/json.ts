/**
 * JSON has no `undefined`. A caller that builds a request body with optional
 * fields writes `undefined` for "not set", and the encoder that turns the body
 * into JSON rejects the whole request with "Expected JSON value". Dropping
 * those keys keeps the wire shape the caller meant.
 */
export const jsonPayload = <T extends Record<string, unknown>>(value: T) =>
  JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
