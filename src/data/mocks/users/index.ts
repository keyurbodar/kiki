import { Effect, Ref } from "effect";
import { UserProfile } from "../../api/schemas/user.ts";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  sampleAccount,
  sampleAppearanceChanges,
  sampleAppearanceFiles,
  sampleGitSigning,
  samplePasskeys,
  sampleUser,
} from "./fixtures.ts";

type Row = Record<string, unknown>;

export const UsersMock = mockGroup("users", (handlers) =>
  Effect.gen(function* () {
    const profile = yield* Ref.make(sampleUser);
    const account = yield* Ref.make<Row>(structuredClone(sampleAccount));
    const changes = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(sampleAppearanceChanges),
    );
    const files = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(sampleAppearanceFiles),
    );
    const passkeys = yield* Ref.make<ReadonlyArray<Row>>(
      structuredClone(samplePasskeys),
    );
    const signing = yield* Ref.make<Row>({
      ...sampleGitSigning,
      id: "signing_sample_alex",
    });
    const acquisition = yield* Ref.make<Row>({
      id: "acq_sample_alex",
      source: "team-invite",
      referrerId: "user_sample_sam",
      recovered: false,
    });
    const mfa = yield* Ref.make<Row>({
      id: "mfa_sample_alex",
      enabled: false,
      method: "passkey",
      refreshedAt: isoMinutesAgo(0),
    });
    const passkeyRequirement = yield* Ref.make<Row>({
      id: "passkey_requirement_sample_alex",
      required: false,
      updatedAt: isoMinutesAgo(0),
    });

    const findRow = (
      rows: ReadonlyArray<Row>,
      id: string,
      table: string,
      key = "id",
    ) => {
      const row = rows.find((candidate) => candidate[key] === id);
      return row
        ? Effect.succeed(row)
        : Effect.die(new Error(`users: no ${table} ${id}`));
    };

    return handlers
      .handle("getCurrent", () => Ref.get(profile))
      .handle("getAccount", () => Ref.get(account))
      .handle("deleteAccount", () =>
        Effect.all(
          [
            Ref.set(account, {}),
            Ref.set(passkeys, []),
            Ref.set(changes, []),
            Ref.set(files, []),
          ],
          { concurrency: 1 },
        ).pipe(
          Effect.as({
            ok: true,
            deleted: true,
            deletedAt: isoMinutesAgo(0),
          }),
        ),
      )
      .handle("replaceAccountEmail", ({ payload }) => {
        const input = fields(payload);
        const email = String(input.email ?? "alex.new@example.com");
        return Effect.flatMap(Ref.get(account), (current) => {
          const emails = (current.emails as ReadonlyArray<Row>).map((row) =>
            row.primary ? { ...row, email, verified: false } : row,
          );
          const next: Row = { ...current, emails };
          return Effect.all(
            [
              Ref.set(account, next),
              Ref.update(
                profile,
                (user) => new UserProfile({ ...user, email }),
              ),
            ],
            { concurrency: 1 },
          ).pipe(Effect.as(next));
        });
      })
      .handle("createAccountEmail", ({ payload }) => {
        const input = fields(payload);
        const row: Row = {
          id: newId("email"),
          email: String(input.email ?? "alex.alt@example.com"),
          primary: false,
          verified: false,
        };
        return Ref.update(account, (current) => ({
          ...current,
          emails: [...(current.emails as ReadonlyArray<Row>), row],
        })).pipe(Effect.as(row));
      })
      .handle("deleteAccountEmail", ({ params }) =>
        Effect.flatMap(Ref.get(account), (current) => {
          const emails = current.emails as ReadonlyArray<Row>;
          return findRow(emails, params.emailId, "email").pipe(
            Effect.flatMap(() => {
              if (emails.length === 1) {
                return Effect.die(
                  new Error("users: cannot delete the only account email"),
                );
              }
              const next: Row = {
                ...current,
                emails: emails.filter((row) => row.id !== params.emailId),
                ...(current.primaryEmailId === params.emailId
                  ? {
                      primaryEmailId: emails.find(
                        (row) => row.id !== params.emailId,
                      )?.id,
                    }
                  : {}),
              };
              return Ref.set(account, next).pipe(Effect.as({ ok: true }));
            }),
          );
        }),
      )
      .handle("setPrimaryAccountEmail", ({ params }) =>
        Effect.flatMap(Ref.get(account), (current) =>
          findRow(
            current.emails as ReadonlyArray<Row>,
            params.emailId,
            "email",
          ).pipe(
            Effect.flatMap((selected) => {
              const next: Row = {
                ...current,
                primaryEmailId: selected.id,
                emails: (current.emails as ReadonlyArray<Row>).map((row) => ({
                  ...row,
                  primary: row.id === selected.id,
                })),
              };
              return Effect.all(
                [
                  Ref.set(account, next),
                  Ref.update(
                    profile,
                    (user) =>
                      new UserProfile({
                        ...user,
                        email: selected.email as string,
                      }),
                  ),
                ],
                { concurrency: 1 },
              ).pipe(Effect.as(next));
            }),
          ),
        ),
      )
      .handle("updateAccountImage", ({ payload }) => {
        const input = fields(payload);
        const imageUrl = String(
          input.imageUrl ?? "https://static.example.com/avatars/alex.png",
        );
        return Effect.all(
          [
            Ref.update(account, (current) => ({ ...current, imageUrl })),
            Ref.update(
              profile,
              (user) => new UserProfile({ ...user, imageUrl }),
            ),
          ],
          { concurrency: 1 },
        ).pipe(Effect.as({ ok: true, imageUrl }));
      })
      .handle("updateAccountName", ({ payload }) => {
        const input = fields(payload);
        const firstName = String(input.firstName ?? "Alex");
        const lastName = String(input.lastName ?? "Morgan");
        return Effect.all(
          [
            Ref.update(account, (current) => ({
              ...current,
              firstName,
              lastName,
            })),
            Ref.update(
              profile,
              (user) => new UserProfile({ ...user, firstName, lastName }),
            ),
          ],
          { concurrency: 1 },
        ).pipe(Effect.as({ ok: true, firstName, lastName }));
      })
      .handle("recoverAcquisition", ({ payload }) => {
        const input = fields(payload);
        return Ref.update(acquisition, (current) => ({
          ...current,
          recovered: true,
          source:
            typeof input.source === "string" ? input.source : current.source,
        })).pipe(Effect.as({ ok: true }));
      })
      .handle("listAppearanceChanges", () => Ref.get(changes))
      .handle("undoAppearanceChange", ({ payload }) => {
        const input = fields(payload);
        return Ref.get(changes).pipe(
          Effect.flatMap((rows) => {
            const target =
              typeof input.id === "string"
                ? rows.find((row) => row.id === input.id)
                : rows[0];
            if (!target) {
              return Effect.die(
                new Error("users: no appearance change to undo"),
              );
            }
            return Ref.set(
              changes,
              rows.filter((row) => row.id !== target.id),
            ).pipe(Effect.as({ ok: true, undone: target }));
          }),
        );
      })
      .handle("updateClientAppearance", ({ payload }) => {
        const input = fields(payload);
        return Ref.update(profile, (user) => ({
          ...user,
          clientAppearance: input,
        })).pipe(Effect.as(input));
      })
      .handle("uploadAppearanceFiles", ({ payload }) => {
        const input = fields(payload);
        const row: Row = {
          id: newId("appearance_file"),
          name: String(input.name ?? "workspace-asset.png"),
          mimeType: String(input.mimeType ?? "image/png"),
          size: typeof input.size === "number" ? input.size : 0,
          url: String(
            input.url ?? "https://static.example.com/appearance/new.png",
          ),
          uploadedAt: isoMinutesAgo(0),
        };
        return Ref.update(files, (rows) => [...rows, row]).pipe(Effect.as(row));
      })
      .handle("appearanceFileUrl", ({ params }) =>
        Effect.flatMap(Ref.get(files), (rows) =>
          findRow(rows, params.fileId, "appearance file").pipe(
            Effect.map((file) => ({
              url: file.url,
              expiresAt: isoMinutesAgo(-60),
            })),
          ),
        ),
      )
      .handle("getGitSigning", () => Ref.get(signing))
      .handle("ensureGitSigning", () =>
        Ref.update(signing, (current) => ({
          ...current,
          enabled: true,
          keyId: current.keyId ?? newId("signing"),
        })).pipe(Effect.as({ ok: true })),
      )
      .handle("rotateGitSigning", () =>
        Ref.update(signing, (current) => ({
          ...current,
          enabled: true,
          keyId: newId("signing"),
          rotatedAt: isoMinutesAgo(0),
        })).pipe(Effect.as({ ok: true })),
      )
      .handle("refreshMfa", () =>
        Ref.update(mfa, (current) => ({
          ...current,
          refreshedAt: isoMinutesAgo(0),
        })).pipe(Effect.as({ ok: true })),
      )
      .handle("listPasskeys", () => Ref.get(passkeys))
      .handle("trustPasskey", ({ params }) =>
        Effect.flatMap(Ref.get(passkeys), (rows) =>
          findRow(rows, params.passkeyId, "passkey").pipe(
            Effect.flatMap(() => {
              const next = rows.map((row) =>
                row.id === params.passkeyId ? { ...row, trusted: true } : row,
              );
              return Ref.set(passkeys, next).pipe(
                Effect.as({ ok: true, id: params.passkeyId }),
              );
            }),
          ),
        ),
      )
      .handle("setPasskeyRequirement", ({ payload }) => {
        const input = fields(payload);
        const required = input.required === true;
        return Ref.set(passkeyRequirement, {
          id: "passkey_requirement_sample_alex",
          required,
          updatedAt: isoMinutesAgo(0),
        }).pipe(Effect.as({ ok: true, required }));
      })
      .handle("updatePreferences", ({ payload }) => {
        const input = fields(payload);
        return Ref.update(
          profile,
          (user) =>
            new UserProfile({
              ...user,
              preferences: { ...user.preferences, ...input },
            }),
        ).pipe(Effect.as({ ok: true }));
      });
  }),
);
