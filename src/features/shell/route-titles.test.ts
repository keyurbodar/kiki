import { describe, expect, it } from "vitest";
import { Route as RootRoute } from "@/routes/__root";
import { Route as CatchAllRoute } from "@/routes/_app/$";
import { Route as AutomationsRoute } from "@/routes/_app/automations";
import { Route as DriveRoute } from "@/routes/_app/drive";
import { Route as ExploreRoute } from "@/routes/_app/explore/index";
import { Route as InvitesRoute } from "@/routes/_app/invites";
import { Route as IssuesRoute } from "@/routes/_app/issues";
import { Route as PullsRoute } from "@/routes/_app/pulls";
import { Route as AppRoute } from "@/routes/_app/route";
import { Route as ThreadsRoute } from "@/routes/_app/threads";

type Headed = {
  options: {
    head?: (ctx: unknown) => { meta?: Array<{ title?: string }> } | undefined;
  };
};

const title = (route: unknown) =>
  (route as Headed).options.head?.({})?.meta?.[0]?.title;

describe("route titles", () => {
  it("names each list route the way Capy does", () => {
    expect(title(IssuesRoute)).toBe("Issues | Capy");
    expect(title(PullsRoute)).toBe("Pull requests | Capy");
    expect(title(ThreadsRoute)).toBe("Threads | Capy");
    expect(title(AutomationsRoute)).toBe("Automations | Capy");
    expect(title(ExploreRoute)).toBe("Explore | Capy");
    expect(title(DriveRoute)).toBe("Capy Drive | Capy");
    expect(title(InvitesRoute)).toBe("Invites | Capy");
  });

  it("names the unknown route after the page it failed to find", () => {
    expect(title(CatchAllRoute)).toBe("Page not found | Capy");
  });
});

describe("route boundaries", () => {
  it("keeps a crash surface on the root and the app routes", () => {
    expect(RootRoute.options.errorComponent).toBeTypeOf("function");
    expect(AppRoute.options.errorComponent).toBeTypeOf("function");
  });

  it("keeps a not-found surface on the root, the app and the catch-all", () => {
    expect(RootRoute.options.notFoundComponent).toBeTypeOf("function");
    expect(AppRoute.options.notFoundComponent).toBeTypeOf("function");
    expect(CatchAllRoute.options.notFoundComponent).toBeTypeOf("function");
  });
});
