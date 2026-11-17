import { org } from "../fixtures/world.ts";

export const sampleOrgDeleted = {
  id: org.id,
  deletedAt: null,
};

export const sampleOrgUpdate = {
  name: org.name,
  slug: org.slug,
  issuePrefix: org.issuePrefix,
};
