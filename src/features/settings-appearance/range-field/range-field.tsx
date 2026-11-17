export function RangeField({
  label,
  value,
  max,
  unit,
  disabled,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit: () => void;
}) {
  const fraction = max === 0 ? 0 : value / max;
  return (
    <div
      data-disabled={disabled || undefined}
      className="flex w-36 max-w-full items-center gap-3 data-disabled:opacity-55 sm:w-52"
    >
      <span className="relative flex h-5 min-w-0 items-center rounded-full has-[:focus-visible]:outline-ring-inset pointer-coarse:h-11 flex-1">
        <span className="relative h-1 w-full overflow-hidden rounded-full bg-secondary">
          <span
            className="absolute inset-y-0 left-0 bg-foreground"
            style={{ width: `${fraction * 100}%` }}
          />
        </span>
        <input
          type="range"
          aria-label={label}
          aria-valuetext={`${value}${unit}`}
          min={0}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          onPointerUp={onCommit}
          onPointerCancel={onCommit}
          onKeyUp={onCommit}
          onBlur={onCommit}
          className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default focus-visible:outline-none"
        />
        <span
          className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-plate"
          style={{
            left: `calc(${fraction * 100}% + ${(0.5 - fraction) * 0.75}rem)`,
          }}
        />
      </span>
      <output className="w-12 text-right text-xs text-muted-foreground-2 tabular-nums">
        {value}
        {unit}
      </output>
    </div>
  );
}
