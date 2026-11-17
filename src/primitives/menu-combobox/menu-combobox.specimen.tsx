import { Combobox } from "@base-ui/react/combobox";
import { Button } from "@/primitives/button";
import {
  MenuCombobox,
  MenuComboboxContent,
  MenuComboboxGroup,
  MenuComboboxGroupLabel,
  MenuComboboxItem,
  MenuComboboxTrigger,
} from "./menu-combobox";

const groups = [
  { value: "Suggested", items: ["bug", "documentation"] },
  { value: "All labels", items: ["design", "enhancement", "question"] },
];

export function MenuComboboxSpecimen({ open = true }: { open?: boolean }) {
  return (
    <div className="flex items-start gap-16 p-6">
      <MenuCombobox items={groups} multiple defaultValue={["bug"]} open={open}>
        <MenuComboboxTrigger
          id="menu-combobox-labels"
          variant="outline"
          size="sm"
        >
          Add labels
        </MenuComboboxTrigger>
        <MenuComboboxContent
          className="w-80"
          searchPlaceholder="Search labels"
          footer={
            <Button variant="ghost" size="sm" className="w-full justify-start">
              Create label
            </Button>
          }
        >
          {(group: (typeof groups)[number]) => (
            <MenuComboboxGroup key={group.value} items={group.items}>
              <MenuComboboxGroupLabel>{group.value}</MenuComboboxGroupLabel>
              <Combobox.Collection>
                {(label: string) => (
                  <MenuComboboxItem key={label} value={label}>
                    {label}
                  </MenuComboboxItem>
                )}
              </Combobox.Collection>
            </MenuComboboxGroup>
          )}
        </MenuComboboxContent>
      </MenuCombobox>
    </div>
  );
}
