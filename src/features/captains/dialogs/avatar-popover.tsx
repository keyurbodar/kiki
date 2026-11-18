import { useAtomSet } from "@effect/atom-react";
import { type ReactElement, useState } from "react";
import {
  captainReactivityKeys,
  removeCaptainLibraryImageAtom,
  uploadCaptainImageAtom,
} from "@/data/atoms/captains";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { toast } from "@/primitives/toaster";
import { type CaptainAvatarValue, withoutImage } from "./avatar";
import { AvatarEditor, type AvatarEditorTab } from "./avatar-editor";
import { squarePng } from "./image-files";
import {
  type CaptainLibraryImage,
  removeForEveryoneDescription,
  toLibraryImages,
} from "./library";
import { useOrgId } from "./session";

export type AvatarPopoverProps = {
  value: CaptainAvatarValue;
  onChange: (value: CaptainAvatarValue) => void;
  children: ReactElement;
  defaultOpen?: boolean;
  initialTab?: AvatarEditorTab;
};

/** Capy's AvatarPopover: the avatar editor, picture uploads and library removal. */
export function AvatarPopover({
  value,
  onChange,
  children,
  defaultOpen = false,
  initialTab,
}: AvatarPopoverProps) {
  const orgId = useOrgId();
  const [open, setOpen] = useState(defaultOpen);
  const [removing, setRemoving] = useState<CaptainLibraryImage | null>(null);
  const upload = useAtomSet(uploadCaptainImageAtom, { mode: "promise" });
  const remove = useAtomSet(removeCaptainLibraryImageAtom, { mode: "promise" });

  const savePicture = (file: File) => {
    if (orgId === undefined) return;
    squarePng(file, 512)
      .then((png) => {
        const payload = new FormData();
        payload.append("image", png, "avatar.png");
        return upload({ params: { orgId }, payload });
      })
      .then((result) => {
        const [image] = toLibraryImages([result]);
        if (image !== undefined)
          onChange({ ...withoutImage(value), image: image.url });
      })
      .catch(() => toast.error("Could not upload this image"));
  };

  const confirmRemove = () => {
    if (removing === null || orgId === undefined) return;
    const image = removing;
    setRemoving(null);
    remove({
      params: { orgId, imageId: image.id },
      reactivityKeys: [
        captainReactivityKeys.library(orgId),
        captainReactivityKeys.captain(orgId),
      ],
    })
      .then(() => {
        if (value.library === image.id) onChange(withoutImage(value));
      })
      .catch(() => toast.error("Could not remove this image"));
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={children} />
        <PopoverContent align="center" className="w-80 gap-2 p-2">
          <AvatarEditor
            value={value}
            onChange={onChange}
            initialTab={initialTab}
            onRemove={(image) => {
              setOpen(false);
              setRemoving(image);
            }}
            onPick={(file) => {
              setOpen(false);
              savePicture(file);
            }}
          />
        </PopoverContent>
      </Popover>
      <Dialog
        open={removing !== null}
        onOpenChange={(next) => {
          if (!next) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove for everyone?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              {removeForEveryoneDescription(removing)}
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button intent="danger" type="button" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
