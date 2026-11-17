import { Schema } from "effect";
import { OrgId } from "./ids.ts";

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
