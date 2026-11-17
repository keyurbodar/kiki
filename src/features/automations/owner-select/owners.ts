import type { RunAs } from "../automation-editor/model";
import type { Member, ServiceUser } from "../automation-editor/read";

export const runnableServiceUsers = (
  serviceUsers: ReadonlyArray<ServiceUser>,
  isAdmin: boolean,
) =>
  serviceUsers.filter(
    (user) =>
      user.disabledAt === null &&
      user.role !== "read_only" &&
      (isAdmin || user.role !== "admin"),
  );

export const matchesQuery = (name: string, query: string) => {
  const needle = query.trim().toLowerCase();
  return needle === "" || name.toLowerCase().includes(needle);
};

export const ownerLabel = (
  value: RunAs | null,
  members: ReadonlyArray<Member>,
  serviceUsers: ReadonlyArray<ServiceUser>,
  fallbackLabel: string,
) => {
  if (value?.kind === "human")
    return (
      members.find((member) => member.userId === value.id)?.name ??
      fallbackLabel
    );
  if (value?.kind === "service")
    return (
      serviceUsers.find((user) => user.id === value.id)?.name ?? fallbackLabel
    );
  return fallbackLabel;
};
