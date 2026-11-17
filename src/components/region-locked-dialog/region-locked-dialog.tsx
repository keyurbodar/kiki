import { useAtom } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import { useRef } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import sadCapyDark from "./sad-capy-dark.svg?url";
import sadCapyLight from "./sad-capy-light.svg?url";

export type RegionLockedDialogState = { open: boolean; model: string };

export const regionLockedDialogAtom = Atom.make<RegionLockedDialogState>({
  open: false,
  model: "",
}).pipe(Atom.keepAlive);

export function regionLockedDescription(model: string) {
  return `${model} is only available in the United States and Canada`;
}

export function RegionLockedDialog() {
  const [state, setState] = useAtom(regionLockedDialogAtom);
  const gotIt = useRef<HTMLButtonElement>(null);
  const close = () => setState({ open: false, model: state.model });

  return (
    <Dialog
      open={state.open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="max-w-68" initialFocus={gotIt}>
        <DialogHeader>
          <div className="col-span-full row-start-1 flex flex-col items-center gap-3 pt-2 text-center">
            <span
              role="img"
              aria-label="Sad Capy"
              className="inline-flex h-12 items-center"
            >
              <img
                src={sadCapyLight}
                alt=""
                className="h-full! w-auto! dark:hidden"
              />
              <img
                src={sadCapyDark}
                alt=""
                className="hidden h-full! w-auto! dark:block"
              />
            </span>
            <DialogTitle>US and Canada only</DialogTitle>
          </div>
          <DialogDescription className="text-center text-balance">
            {regionLockedDescription(state.model)}
          </DialogDescription>
        </DialogHeader>
        <div className="pb-4" />
        <DialogFooter className="justify-center">
          <Button
            data-track-owner="shared/region-locked-dialog.tsx#RegionLockedDialog:Button[Got it]"
            ref={gotIt}
            onClick={close}
          >
            Got it
          </Button>
        </DialogFooter>
        <div className="pb-2" />
      </DialogContent>
    </Dialog>
  );
}
