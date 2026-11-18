import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { createOrganizationAtom } from "@/data/atoms/promotions";
import { organizationsAtom } from "@/data/atoms/session";
import { toast } from "@/primitives/toaster";
import { failedWithoutValue, resultValue } from "./results";

export type PromotionOrganization = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

const readCreated = (value: unknown): PromotionOrganization | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { id, name, avatarUrl } = value as Record<string, unknown>;
  if (typeof id !== "string" || typeof name !== "string") return undefined;
  return {
    id,
    name,
    avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null,
  };
};

export function usePromotionOrganizations(createdDescription: string) {
  const result = useAtomValue(organizationsAtom);
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  const createOrganization = useAtomSet(createOrganizationAtom, {
    mode: "promise",
  });
  const [selectedOrgId, setSelectedOrgId] = useState<string>();
  const [created, setCreated] = useState<PromotionOrganization>();
  const [creating, setCreating] = useState(false);

  const manageable = resultValue(result)
    ?.filter(
      (organization) =>
        organization.accessLevel === "admin" ||
        organization.accessLevel === "owner",
    )
    .map(({ id, name, avatarUrl }) => ({ id, name, avatarUrl }));
  const organizations =
    manageable !== undefined &&
    created !== undefined &&
    !manageable.some((organization) => organization.id === created.id)
      ? [...manageable, created]
      : manageable;

  const create = (name: string) => {
    setCreating(true);
    return createOrganization({ payload: { name } })
      .then((value) => {
        const organization = readCreated(value);
        if (organization === undefined) throw new Error("Unexpected response");
        setCreated(organization);
        setSelectedOrgId(organization.id);
        refreshOrganizations();
        toast.success("Organization created", {
          description: createdDescription,
        });
      })
      .catch((error: unknown) => {
        toast.error("Could not create the organization");
        return Promise.reject(error);
      })
      .finally(() => setCreating(false));
  };

  return {
    organizations,
    organizationsError: failedWithoutValue(result),
    effectiveOrgId: selectedOrgId ?? organizations?.[0]?.id,
    setSelectedOrgId,
    refreshOrganizations,
    creating,
    create,
  };
}
