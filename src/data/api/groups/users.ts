import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Unauthorized } from "../schemas/errors.ts";
import { UserProfile } from "../schemas/user.ts";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class UsersGroup extends HttpApiGroup.make("users").add(
  HttpApiEndpoint.get("getCurrent", "/me", {
    success: UserProfile,
    error: Unauthorized,
  }),
  HttpApiEndpoint.get("getAccount", "/me/account", { success: Undecoded }),
  HttpApiEndpoint.delete("deleteAccount", "/me/account", {
    success: Undecoded,
  }),
  HttpApiEndpoint.post("replaceAccountEmail", "/me/account/email", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("createAccountEmail", "/me/account/emails", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.delete("deleteAccountEmail", "/me/account/emails/:emailId", {
    params: { emailId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "setPrimaryAccountEmail",
    "/me/account/emails/:emailId/primary",
    { params: { emailId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.post("updateAccountImage", "/me/account/image", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateAccountName", "/me/account/name", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("recoverAcquisition", "/me/acquisition", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listAppearanceChanges", "/me/appearance/changes", {
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("undoAppearanceChange", "/me/appearance/changes/undo", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updateClientAppearance", "/me/appearance/client", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("uploadAppearanceFiles", "/me/appearance/files", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("appearanceFileUrl", "/me/appearance/files/:fileId/url", {
    params: { fileId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get("getGitSigning", "/me/git-signing", {
    success: Undecoded,
  }),
  HttpApiEndpoint.post("ensureGitSigning", "/me/git-signing", {
    success: Undecoded,
  }),
  HttpApiEndpoint.post("rotateGitSigning", "/me/git-signing/rotate", {
    success: Undecoded,
  }),
  HttpApiEndpoint.post("refreshMfa", "/me/mfa/refresh", { success: Undecoded }),
  HttpApiEndpoint.get("listPasskeys", "/me/passkeys", { success: Undecoded }),
  HttpApiEndpoint.post("trustPasskey", "/me/passkeys/:passkeyId/trust", {
    params: { passkeyId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.put("setPasskeyRequirement", "/me/passkeys/requirement", {
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.patch("updatePreferences", "/me/preferences", {
    payload: Undecoded,
    success: Undecoded,
  }),
) {}
