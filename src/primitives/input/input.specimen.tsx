import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "./input";

export function InputSpecimen() {
  return (
    <div className="flex w-80 flex-col gap-3 p-6">
      {(["xs", "sm", "base"] as const).map((size) => (
        <Input key={size} size={size} placeholder={`Input ${size}`} />
      ))}
      <Input defaultValue="Filled value" />
      <Input variant="ghost" defaultValue="Ghost title" />
      <Input variant="ghost" placeholder="Ghost placeholder" />
      <Input variant="blank" placeholder="Blank" />
      <Input font="mono" defaultValue="sk-live-1234" />
      <Input font="numeric" defaultValue="1234.50" />
      <Input aria-invalid defaultValue="Invalid" />
      <Input disabled placeholder="Disabled" />
      <Input icon={<Icon name="search-menu" />} placeholder="Search" />
      <Input
        size="xs"
        icon={<Icon name="search-menu" />}
        placeholder="Search xs"
      />
      <Input
        size="sm"
        icon={<Icon name="search-menu" />}
        placeholder="Search sm"
      />
      <InputGroup>
        <Input placeholder="In a group" />
      </InputGroup>
    </div>
  );
}
