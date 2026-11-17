import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectGroup,
  MenuSelectItem,
  MenuSelectLabel,
  MenuSelectTrigger,
  MenuSelectValue,
} from "./menu-select";

const access = [
  { value: "default", label: "Workspace default" },
  { value: "everyone", label: "Everyone in the workspace" },
  { value: "specific", label: "Only specific people" },
];

const roles = [
  { value: "all", label: "All roles" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

export function MenuSelectSpecimen({ open = true }: { open?: boolean }) {
  return (
    <div className="flex items-start gap-16 p-6">
      <MenuSelect
        items={access}
        defaultValue="default"
        open={open}
        modal={false}
      >
        <MenuSelectTrigger
          id="menu-select-access"
          variant="outline"
          size="sm"
          className="w-56"
        >
          <MenuSelectValue />
        </MenuSelectTrigger>
        <MenuSelectContent>
          {access.map((item) => (
            <MenuSelectItem key={item.value} value={item.value}>
              {item.label}
            </MenuSelectItem>
          ))}
        </MenuSelectContent>
      </MenuSelect>
      <MenuSelect items={roles} defaultValue="all" open={open} modal={false}>
        <MenuSelectTrigger
          id="menu-select-roles"
          variant="outline"
          size="sm"
          className="w-44"
        >
          <MenuSelectValue />
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectGroup>
            <MenuSelectLabel>Roles</MenuSelectLabel>
            {roles.map((item) => (
              <MenuSelectItem key={item.value} value={item.value}>
                {item.label}
              </MenuSelectItem>
            ))}
          </MenuSelectGroup>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
}
