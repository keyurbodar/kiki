import { useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSearchRow,
  MenuTrigger,
} from "@/primitives/menu";
import { membersAtom, serviceUsersAtom } from "../automation-editor/atoms";
import { Checkmark, ChevronDownSmall } from "../automation-editor/icons";
import type { RunAs } from "../automation-editor/model";
import {
  chevronClass,
  cx,
  menuCheckClass,
  menuEmptyClass,
  menuLabelClass,
  menuSearchInputClass,
  PersonAvatar,
  stopMenuKeys,
} from "../automation-editor/parts";
import {
  type Member,
  readMembers,
  readServiceUsers,
  type ServiceUser,
} from "../automation-editor/read";
import { resultValue, useOrgId } from "../automation-editor/use-org";
import { matchesQuery, ownerLabel, runnableServiceUsers } from "./owners";

export type OwnerSelectProps = {
  value: RunAs | null;
  fallbackLabel: string;
  onValueChange: (value: RunAs) => void;
  defaultOpen?: boolean;
  className?: string;
};

export function OwnerSelect(props: OwnerSelectProps) {
  const orgId = useOrgId() ?? "";
  const members = readMembers(resultValue(useAtomValue(membersAtom(orgId))));
  const serviceUsers = runnableServiceUsers(
    readServiceUsers(resultValue(useAtomValue(serviceUsersAtom(orgId)))),
    false,
  );
  return <OwnerMenu {...props} members={members} serviceUsers={serviceUsers} />;
}

export type OwnerMenuProps = OwnerSelectProps & {
  members: ReadonlyArray<Member>;
  serviceUsers: ReadonlyArray<ServiceUser>;
};

export function OwnerMenu({
  value,
  fallbackLabel,
  onValueChange,
  defaultOpen,
  className,
  members,
  serviceUsers,
}: OwnerMenuProps) {
  const [query, setQuery] = useState("");
  const selectedMember =
    value?.kind === "human"
      ? members.find((member) => member.userId === value.id)
      : undefined;
  const label = ownerLabel(value, members, serviceUsers, fallbackLabel);
  const shownMembers = members.filter((member) =>
    matchesQuery(member.name, query),
  );
  const shownServiceUsers = serviceUsers.filter((user) =>
    matchesQuery(user.name, query),
  );
  return (
    <Menu
      defaultOpen={defaultOpen}
      onOpenChange={(open) => (open ? undefined : setQuery(""))}
    >
      <MenuTrigger
        render={
          <Button
            variant="bare"
            size="auto-sm"
            aria-label="Runs as"
            className={cx("-m-1 p-1", className)}
          />
        }
      >
        <PersonAvatar name={label} src={selectedMember?.imageUrl ?? null} />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDownSmall className={chevronClass} />
      </MenuTrigger>
      <MenuContent className="w-64">
        <MenuSearchRow>
          <input
            className={menuSearchInputClass}
            placeholder="Search members and service users"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={stopMenuKeys}
          />
        </MenuSearchRow>
        {shownMembers.length === 0 && shownServiceUsers.length === 0 ? (
          <div className={menuEmptyClass}>No matches</div>
        ) : (
          <>
            {shownMembers.length > 0 && shownServiceUsers.length > 0 ? (
              <MenuLabel>Members</MenuLabel>
            ) : null}
            {shownMembers.map((member) => (
              <MenuItem
                key={member.userId}
                onClick={() =>
                  onValueChange({ kind: "human", id: member.userId })
                }
              >
                <PersonAvatar name={member.name} src={member.imageUrl} />
                <span className={menuLabelClass}>{member.name}</span>
                {value?.kind === "human" && value.id === member.userId ? (
                  <Checkmark className={cx("ml-auto", menuCheckClass)} />
                ) : null}
              </MenuItem>
            ))}
            {shownServiceUsers.length > 0 ? (
              <MenuLabel>Service users</MenuLabel>
            ) : null}
            {shownServiceUsers.map((user) => (
              <MenuItem
                key={user.id}
                onClick={() => onValueChange({ kind: "service", id: user.id })}
              >
                <PersonAvatar name={user.name} src={null} />
                <span className={menuLabelClass}>{user.name}</span>
                {value?.kind === "service" && value.id === user.id ? (
                  <Checkmark className={cx("ml-auto", menuCheckClass)} />
                ) : null}
              </MenuItem>
            ))}
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
