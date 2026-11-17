import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, world } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type LinearLink,
  type SlackLink,
  sampleGitHubInstallation,
  sampleGitHubInstallationRepos,
  sampleGitHubReachableInstallations,
  sampleGitHubUser,
  sampleGitHubWorkspace,
  sampleLinearConnection,
  sampleLinearLabels,
  sampleLinearLinks,
  sampleLinearTeams,
  sampleLinearTemplate,
  sampleOAuthStart,
  samplePaperConnection,
  sampleSlackChannel,
  sampleSlackChannels,
  sampleSlackConnection,
  sampleSlackEmojis,
  sampleSlackLinks,
  sampleSlackTemplate,
  sampleSlackUserRead,
  sampleSlackUsers,
  sampleTailscaleConnection,
  sampleThreadSlackUserReadAccess,
} from "./fixtures.ts";

interface Connection {
  readonly connected: boolean;
  readonly connectedAt: string | null;
  readonly [key: string]: unknown;
}

const stringValue = (input: Record<string, unknown>, key: string) =>
  typeof input[key] === "string" ? (input[key] as string) : undefined;

const updatedAt = () => isoMinutesAgo(0);

const withConnection = (row: object, connected = true): Connection => ({
  ...row,
  connected,
  connectedAt: connected ? updatedAt() : null,
});

const notFound = (kind: string, id: string) =>
  Effect.die(new Error(`integrations.${kind}: no row ${id}`));

export const IntegrationsMock = mockGroup("integrations", (handlers) =>
  Effect.gen(function* () {
    const githubUser = yield* Ref.make<Connection>(
      withConnection(sampleGitHubUser),
    );
    const githubInstallation = yield* Ref.make<Connection>(
      withConnection(sampleGitHubInstallation),
    );
    const linear = yield* Ref.make<Connection>(
      withConnection(sampleLinearConnection),
    );
    const linearLinks = yield* Ref.make<LinearLink[]>([...sampleLinearLinks]);
    const paper = yield* Ref.make<Connection>(
      withConnection(samplePaperConnection),
    );
    const slack = yield* Ref.make<Connection>(
      withConnection(sampleSlackConnection),
    );
    const slackLinks = yield* Ref.make<SlackLink[]>([...sampleSlackLinks]);
    const slackUserRead = yield* Ref.make<Connection>(
      withConnection(sampleSlackUserRead),
    );
    const tailscale = yield* Ref.make<Connection>(
      withConnection(sampleTailscaleConnection),
    );

    const updateAccess = (
      accessId: string,
      status: string,
      scopes?: ReadonlyArray<string>,
    ) =>
      Effect.gen(function* () {
        const current = yield* Ref.get(slackUserRead);
        const requests = current.requests as ReadonlyArray<
          Record<string, unknown>
        >;
        if (!requests.some((row) => row.id === accessId)) {
          return yield* notFound("slackUserReadAccess", accessId);
        }
        const updated: Connection = {
          ...current,
          requests: requests.map((row) =>
            row.id === accessId
              ? { ...row, status, ...(scopes ? { scopes } : {}) }
              : row,
          ),
          updatedAt: updatedAt(),
        };
        yield* Ref.set(slackUserRead, updated);
        return { ok: true, accessId, status };
      });

    return handlers
      .handle("completeGitHubOAuth", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(githubUser);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "login")
              ? { login: stringValue(input, "login") }
              : {}),
            ...withConnection({}),
          };
          yield* Ref.set(githubUser, updated);
          return updated;
        });
      })
      .handle("getGitHubUser", () => Ref.get(githubUser))
      .handle("disconnectGitHubUser", () =>
        Effect.map(
          Ref.updateAndGet(githubUser, (current) =>
            withConnection(current, false),
          ),
          () => ({ ok: true }),
        ),
      )
      .handle("completeLinearLink", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const rows = yield* Ref.get(linearLinks);
          const link: LinearLink = {
            ...sampleLinearTemplate,
            id: newId("lin_link"),
            threadId:
              stringValue(input, "threadId") ?? sampleLinearTemplate.threadId,
            issueKey:
              stringValue(input, "issueKey") ?? sampleLinearTemplate.issueKey,
            createdAt: updatedAt(),
          };
          yield* Ref.set(linearLinks, [...rows, link]);
          return link;
        });
      })
      .handle("previewLinearLink", ({ payload }) => {
        const input = fields(payload);
        return Effect.succeed({
          provider: "linear",
          threadId:
            stringValue(input, "threadId") ?? world.threads.checkoutTest.id,
          issueKey:
            stringValue(input, "issueKey") ?? sampleLinearTemplate.issueKey,
          issueTitle: sampleLinearTemplate.issueTitle,
          issueUrl: sampleLinearTemplate.issueUrl,
          valid: true,
        });
      })
      .handle("completeLinearOAuth", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(linear);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "teamId")
              ? { teamId: stringValue(input, "teamId") }
              : {}),
            ...withConnection({}),
          };
          yield* Ref.set(linear, updated);
          return updated;
        });
      })
      .handle("getPaper", () => Ref.get(paper))
      .handle("disconnectPaper", () =>
        Effect.map(
          Ref.updateAndGet(paper, (current) => withConnection(current, false)),
          () => ({ ok: true }),
        ),
      )
      .handle("completePaperOAuth", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(paper);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "email")
              ? { email: stringValue(input, "email") }
              : {}),
            ...withConnection({}),
          };
          yield* Ref.set(paper, updated);
          return updated;
        });
      })
      .handle("completeSlackLink", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const rows = yield* Ref.get(slackLinks);
          const link: SlackLink = {
            ...sampleSlackTemplate,
            id: newId("slack_link"),
            threadId:
              stringValue(input, "threadId") ?? sampleSlackTemplate.threadId,
            channelId:
              stringValue(input, "channelId") ?? sampleSlackTemplate.channelId,
            createdAt: updatedAt(),
          };
          yield* Ref.set(slackLinks, [...rows, link]);
          return link;
        });
      })
      .handle("previewSlackLink", ({ payload }) => {
        const input = fields(payload);
        return Effect.succeed({
          provider: "slack",
          threadId:
            stringValue(input, "threadId") ?? world.threads.checkoutTest.id,
          channelId: stringValue(input, "channelId") ?? sampleSlackChannel.id,
          channelName: sampleSlackChannel.name,
          valid: true,
        });
      })
      .handle("completeSlackOAuth", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(slack);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "teamId")
              ? { teamId: stringValue(input, "teamId") }
              : {}),
            ...withConnection({}),
          };
          yield* Ref.set(slack, updated);
          return updated;
        });
      })
      .handle("disconnectGitHubDependencyReader", () =>
        Effect.succeed({ ok: true, connected: false }),
      )
      .handle("getGitHubInstallation", () => Ref.get(githubInstallation))
      .handle("disconnectGitHubInstallation", () =>
        Effect.map(
          Ref.updateAndGet(githubInstallation, (current) =>
            withConnection(current, false),
          ),
          () => ({ ok: true }),
        ),
      )
      .handle("unlinkGitHubInstallation", ({ params }) =>
        Effect.map(
          Ref.updateAndGet(githubInstallation, (current) =>
            withConnection(current, false),
          ),
          () => ({ ok: true, installationId: params.installationId }),
        ),
      )
      .handle("linkGitHubInstallation", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(githubInstallation);
          const installationId =
            stringValue(input, "installationId") ?? sampleGitHubInstallation.id;
          const updated: Connection = {
            ...current,
            id: installationId,
            ...withConnection({}),
          };
          yield* Ref.set(githubInstallation, updated);
          return updated;
        });
      })
      .handle("listGitHubReachableInstallations", () =>
        Effect.succeed(sampleGitHubReachableInstallations),
      )
      .handle("listGitHubInstallationRepos", () =>
        Effect.succeed(sampleGitHubInstallationRepos),
      )
      .handle("startGitHubInstallation", ({ query }) =>
        Effect.succeed(
          sampleOAuthStart(
            "github-installation",
            stringValue(fields(query), "state") ?? "state_sample_installation",
          ),
        ),
      )
      .handle("startGitHubUserOAuth", ({ query }) =>
        Effect.succeed(
          sampleOAuthStart(
            "github-user",
            stringValue(fields(query), "state") ?? "state_sample_github",
          ),
        ),
      )
      .handle("getGitHubWorkspace", () => Effect.succeed(sampleGitHubWorkspace))
      .handle("getLinear", () => Ref.get(linear))
      .handle("updateLinear", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(linear);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "teamId")
              ? { teamId: stringValue(input, "teamId") }
              : {}),
            ...(stringValue(input, "defaultIssueStateId")
              ? {
                  defaultIssueStateId: stringValue(
                    input,
                    "defaultIssueStateId",
                  ),
                }
              : {}),
            ...(typeof input.autoLinkEnabled === "boolean"
              ? { autoLinkEnabled: input.autoLinkEnabled }
              : {}),
          };
          yield* Ref.set(linear, updated);
          return updated;
        });
      })
      .handle("disconnectLinear", () =>
        Effect.map(
          Ref.updateAndGet(linear, (current) => withConnection(current, false)),
          () => ({ ok: true }),
        ),
      )
      .handle("listLinearLabels", () => Effect.succeed(sampleLinearLabels))
      .handle("listLinearLinks", () => Ref.get(linearLinks))
      .handle("deleteLinearLink", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(linearLinks);
          if (!rows.some((row) => row.id === params.linkId)) {
            return yield* notFound("linearLinks", params.linkId);
          }
          yield* Ref.set(
            linearLinks,
            rows.filter((row) => row.id !== params.linkId),
          );
          return { ok: true };
        }),
      )
      .handle("startLinearOAuth", () =>
        Effect.succeed(sampleOAuthStart("linear", "state_sample_linear")),
      )
      .handle("listLinearTeams", () => Effect.succeed(sampleLinearTeams))
      .handle("startPaperOAuth", () =>
        Effect.succeed(sampleOAuthStart("paper", "state_sample_paper")),
      )
      .handle("getSlack", () => Ref.get(slack))
      .handle("updateSlack", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(slack);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "defaultChannelId")
              ? { defaultChannelId: stringValue(input, "defaultChannelId") }
              : {}),
            ...(typeof input.notificationsEnabled === "boolean"
              ? { notificationsEnabled: input.notificationsEnabled }
              : {}),
          };
          yield* Ref.set(slack, updated);
          return updated;
        });
      })
      .handle("disconnectSlack", () =>
        Effect.map(
          Ref.updateAndGet(slack, (current) => withConnection(current, false)),
          () => ({ ok: true }),
        ),
      )
      .handle("listSlackChannels", () => Effect.succeed(sampleSlackChannels))
      .handle("listSlackEmojis", () => Effect.succeed(sampleSlackEmojis))
      .handle("listSlackLinks", () => Ref.get(slackLinks))
      .handle("deleteSlackLink", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(slackLinks);
          if (!rows.some((row) => row.id === params.linkId)) {
            return yield* notFound("slackLinks", params.linkId);
          }
          yield* Ref.set(
            slackLinks,
            rows.filter((row) => row.id !== params.linkId),
          );
          return { ok: true };
        }),
      )
      .handle("linkSlackSelf", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(slackLinks);
          const link: SlackLink = {
            ...sampleSlackTemplate,
            id: newId("slack_link"),
            createdAt: updatedAt(),
          };
          yield* Ref.set(slackLinks, [...rows, link]);
          return link;
        }),
      )
      .handle("startSlackOAuth", ({ payload }) =>
        Effect.succeed(
          sampleOAuthStart(
            "slack",
            stringValue(fields(payload), "state") ?? "state_sample_slack",
          ),
        ),
      )
      .handle("getSlackUserRead", () => Ref.get(slackUserRead))
      .handle("setSlackUserReadAccess", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(slackUserRead);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "access")
              ? { access: stringValue(input, "access") }
              : {}),
            ...(typeof input.enabled === "boolean"
              ? { enabled: input.enabled }
              : {}),
            updatedAt: updatedAt(),
          };
          yield* Ref.set(slackUserRead, updated);
          return updated;
        });
      })
      .handle("disconnectSlackUserRead", () =>
        Effect.map(
          Ref.updateAndGet(slackUserRead, (current) =>
            withConnection(current, false),
          ),
          () => ({ ok: true }),
        ),
      )
      .handle("denySlackUserRead", ({ params }) =>
        updateAccess(params.accessId, "denied"),
      )
      .handle("grantSlackUserRead", ({ params, payload }) => {
        const scopes = fields(payload).scopes;
        return updateAccess(
          params.accessId,
          "granted",
          Array.isArray(scopes) ? scopes.map(String) : undefined,
        );
      })
      .handle("revokeSlackUserRead", ({ params }) =>
        updateAccess(params.accessId, "revoked"),
      )
      .handle("startSlackUserReadOAuth", () =>
        Effect.succeed(
          sampleOAuthStart("slack-user-read", "state_sample_slack_read"),
        ),
      )
      .handle("listSlackUsers", () => Effect.succeed(sampleSlackUsers))
      .handle("getTailscale", () => Ref.get(tailscale))
      .handle("connectTailscale", ({ payload }) => {
        const input = fields(payload);
        return Effect.gen(function* () {
          const current = yield* Ref.get(tailscale);
          const updated: Connection = {
            ...current,
            ...(stringValue(input, "tailnet")
              ? { tailnet: stringValue(input, "tailnet") }
              : {}),
            ...(Array.isArray(input.tags)
              ? { tags: input.tags.map(String) }
              : {}),
            ...withConnection({}),
          };
          yield* Ref.set(tailscale, updated);
          return updated;
        });
      })
      .handle("disconnectTailscale", () =>
        Effect.map(
          Ref.updateAndGet(tailscale, (current) =>
            withConnection(current, false),
          ),
          () => ({ ok: true }),
        ),
      )
      .handle("listThreadSlackUserReadAccess", ({ params }) => {
        const thread = Object.values(world.threads).find(
          (row) => row.id === params.threadId,
        );
        if (!thread) return notFound("threads", params.threadId);
        return Effect.succeed(
          sampleThreadSlackUserReadAccess.map((row) => ({
            ...row,
            threadId: thread.id,
          })),
        );
      });
  }),
);
