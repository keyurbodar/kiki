import { useRef } from "react";

export type AvatarEditorProps = {
  src: string | null;
  name: string;
  label: string;
  title: string;
  busy?: boolean;
  disabled?: boolean;
  size?: "base" | "lg";
  onImage: (file: File) => void;
  onRemove?: () => void;
};

export function AvatarEditor({
  src,
  name,
  label,
  busy = false,
  disabled = false,
  onImage,
  onRemove,
}: AvatarEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <span data-slot="avatar" role="img" aria-label={name} />
      <button
        type="button"
        aria-label={label}
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
      />
      {onRemove === undefined || src === null ? null : (
        <button
          type="button"
          aria-label="Remove image"
          disabled={disabled || busy}
          onClick={onRemove}
        />
      )}
      <input
        ref={input}
        type="file"
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) onImage(file);
        }}
      />
    </>
  );
}
