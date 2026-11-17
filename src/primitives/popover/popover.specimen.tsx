import { Popover, PopoverContent, PopoverTrigger } from ".";

export function PopoverSpecimen() {
  return (
    <div className="flex gap-80 p-6">
      <Popover open>
        <PopoverTrigger className="text-sm">+</PopoverTrigger>
        <PopoverContent side="bottom" arrow>
          Popover content
        </PopoverContent>
      </Popover>
      <Popover open>
        <PopoverTrigger className="text-sm">Unstyled</PopoverTrigger>
        <PopoverContent side="bottom" variant="unstyled">
          Unstyled content
        </PopoverContent>
      </Popover>
    </div>
  );
}
