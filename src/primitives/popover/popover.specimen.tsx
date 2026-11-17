import { Popover, PopoverContent, PopoverTrigger } from ".";

const rows = Array.from(
  { length: 24 },
  (_, index) => `Neutral row ${index + 1}`,
);

export function PopoverSpecimen() {
  return (
    <div className="flex flex-wrap items-start gap-16 p-6">
      <Popover open>
        <PopoverTrigger className="text-sm">Open</PopoverTrigger>
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
      <Popover open>
        <PopoverTrigger className="text-sm">Align end</PopoverTrigger>
        <PopoverContent side="top" align="end">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Popover title</span>
            <span className="text-xs text-muted-foreground-2">
              Neutral body copy for the default surface.
            </span>
          </div>
        </PopoverContent>
      </Popover>
      <Popover open>
        <PopoverTrigger className="text-sm">Long list</PopoverTrigger>
        <PopoverContent side="bottom" className="w-56">
          <div className="flex min-h-0 flex-col overflow-y-auto">
            {rows.map((row) => (
              <span key={row} className="px-1 py-1.5 text-xs">
                {row}
              </span>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
