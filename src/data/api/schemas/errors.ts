import { Schema } from "effect";
import { JamId, OrgId } from "./ids.ts";

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "capy/Unauthorized",
  {},
  { httpApiStatus: 401 },
) {}

export class Forbidden extends Schema.TaggedError<Forbidden>()(
  "capy/Forbidden",
  {
    mfaRequiredOrgId: Schema.optional(OrgId),
    ssoRequired: Schema.optional(Schema.Boolean),
    passkeyRequired: Schema.optional(Schema.Boolean),
  },
  { httpApiStatus: 403 },
) {}

export class JamNotFound extends Schema.TaggedError<JamNotFound>()(
  "capy/JamNotFound",
  { jamId: JamId },
  { httpApiStatus: 404 },
) {}

export class InvalidRequest extends Schema.TaggedError<InvalidRequest>()(
  "capy/InvalidRequest",
  { message: Schema.String },
  { httpApiStatus: 400 },
) {}

export class ThreadOrganizationNotFound extends Schema.TaggedError<ThreadOrganizationNotFound>()(
  "capy/ThreadOrganizationNotFound",
  {},
  { httpApiStatus: 404 },
) {}
