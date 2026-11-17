import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";

export const serviceUserDetails: Readonly<
  Record<string, { readonly projectIds: ReadonlyArray<string> }>
> = {
  svc_sample_release: {
    projectIds: [projects.web.id, projects.api.id],
  },
};

export const serviceUserSubscriptions = [
  {
    id: "sub_sample_release_activity",
    serviceUserId: "svc_sample_release",
    name: "Issue activity",
    event: "issue.updated",
    target: "https://hooks.example.com/acme/issues",
    enabled: true,
    createdAt: isoMinutesAgo(20 * 24 * 60),
  },
] as const;

export const serviceUserDefaults = {
  role: "service",
  createdBy: people.alex.id,
  projectIds: [projects.web.id],
} as const;
