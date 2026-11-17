export type CopyFieldProps = {
  value: string;
  label: string;
  secret?: boolean;
  size?: "sm" | "base";
  className?: string;
};

export function CopyField({ value, label, className }: CopyFieldProps) {
  return (
    <div data-slot="copy-field" className={className}>
      <input readOnly value={value} aria-label={label} />
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={() => void navigator.clipboard?.writeText(value)}
      />
    </div>
  );
}
