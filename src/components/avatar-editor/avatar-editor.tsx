import { cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type EditableImage,
  ImageCropEditor,
  NO_EDIT,
} from "@/components/image-crop-editor";
import { Button, ButtonIcon } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

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

const avatarSizes = {
  base: "size-8 text-xs",
  lg: "size-16 rounded-md text-lg",
} as const;

const pictureTypes: ReadonlyArray<string> = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const pictureAccept = pictureTypes.join(",");

const pictureMaxBytes = 10 * 1024 * 1024;

const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

function Avatar({
  src,
  name,
  size,
}: {
  src: string | null;
  name: string;
  size: keyof typeof avatarSizes;
}) {
  const [failed, setFailed] = useState(false);
  if (src !== null && src !== "" && !failed)
    return (
      <span
        data-slot="avatar"
        className={cx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          avatarSizes[size],
        )}
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span
      data-slot="avatar"
      role="img"
      aria-label={name}
      className={cx(
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground",
        avatarSizes[size],
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarEditor({
  src,
  name,
  label,
  title,
  busy = false,
  disabled = false,
  size = "base",
  onImage,
  onRemove,
}: AvatarEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<EditableImage | null>(null);
  const large = size === "lg";

  const choose = (file: File) => {
    if (
      !(
        file.size > 0 &&
        file.size <= pictureMaxBytes &&
        pictureTypes.includes(file.type)
      )
    ) {
      toast.error("Choose a GIF, JPEG, PNG, or WebP image up to 10 MB");
      return;
    }
    const next: EditableImage = {
      name: file.name,
      blob: file,
      source: file,
      edit: NO_EDIT,
      image: URL.createObjectURL(file),
    };
    if (file.type !== "image/gif") {
      setImage(next);
      return;
    }
    URL.revokeObjectURL(next.image);
    onImage(file);
  };

  const remove =
    onRemove === undefined || src === null ? null : (
      <Button
        data-track-owner="shared/avatar-editor.tsx#AvatarEditor:Button[Remove image]"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove image"
        disabled={disabled || busy}
        onClick={onRemove}
      >
        <ButtonIcon>
          <Icon name="trash-can" />
        </ButtonIcon>
      </Button>
    );

  return (
    <>
      <span className={large ? "relative shrink-0" : "contents"}>
        <Avatar src={src} name={name} size={size} />
        <Button
          data-track-owner="shared/avatar-editor.tsx#AvatarEditor:Button.1"
          variant={large ? "solid" : "ghost"}
          size="icon-sm"
          aria-label={label}
          loading={busy}
          loadingLabel={
            <span key="label" className="sr-only">
              Uploading
            </span>
          }
          disabled={disabled}
          className={large ? "absolute -right-2 -bottom-2" : undefined}
          onClick={() => input.current?.click()}
        >
          <ButtonIcon>
            <Icon name="edit-small-1" />
          </ButtonIcon>
        </Button>
      </span>
      {remove}
      <input
        data-track-owner="shared/avatar-editor.tsx#AvatarEditor:input.1"
        ref={input}
        type="file"
        accept={pictureAccept}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) choose(file);
        }}
      />
      {image === null ? null : (
        <ImageCropEditor
          image={image}
          title={title}
          aspect="square"
          onClose={() => {
            URL.revokeObjectURL(image.image);
            setImage(null);
          }}
          onSave={(saved) => {
            URL.revokeObjectURL(image.image);
            URL.revokeObjectURL(saved.image);
            setImage(null);
            onImage(
              new File([saved.blob], saved.name, { type: saved.blob.type }),
            );
          }}
        />
      )}
    </>
  );
}
