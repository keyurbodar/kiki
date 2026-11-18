import type { UserProfile } from "@/data/api/schemas/user";
import { UserAvatar } from "./user-avatar";

export type UserPreviewProps = {
  user: UserProfile | undefined;
  name: string;
  orgName: string | undefined;
};

/**
 * The account hover card for the sidebar's user chip: who you are signed in as,
 * and where. Capy has no open capture of this card, so the content is the
 * minimum its own chip already knows — avatar, name, email and organization.
 */
export function UserPreview({ user, name, orgName }: UserPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar src={user?.imageUrl ?? null} name={name} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          {orgName === undefined ? null : (
            <span className="truncate text-xs font-normal text-muted-foreground-2">
              {orgName}
            </span>
          )}
        </span>
      </div>
      {user?.email ? (
        <span className="truncate text-xs font-normal text-muted-foreground-1">
          {user.email}
        </span>
      ) : null}
    </div>
  );
}
