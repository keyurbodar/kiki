import { type RefObject, useEffect, useId, useRef, useState } from "react";
import { filesFromTransfer, hasFiles } from "./attachments";
import {
  activateDropTarget,
  dropTargetFor,
  registerDropTarget,
} from "./drop-targets";

/**
 * Document-level file drag tracking for one composer root. Returns whether
 * files are being dragged toward this composer and an `activate` callback the
 * root calls on focus and pointer down.
 */
export function useAttachmentDrop(
  root: RefObject<HTMLElement | null>,
  onFilesAdded: (files: ReadonlyArray<File>) => void,
  enabled = true,
) {
  const id = useId();
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const addFiles = useRef(onFilesAdded);
  addFiles.current = onFilesAdded;

  useEffect(() => {
    if (enabled) return registerDropTarget(id, root);
  }, [enabled, id, root]);

  useEffect(() => {
    if (!enabled) return;
    const reset = () => {
      depth.current = 0;
      setDragging(false);
    };
    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event.dataTransfer) || dropTargetFor(event.target) !== id)
        return;
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    };
    const onLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) return reset();
      if (dropTargetFor(event.target) !== id) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const onOver = (event: DragEvent) => {
      if (!hasFiles(event.dataTransfer) || dropTargetFor(event.target) !== id)
        return;
      event.preventDefault();
      if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event.dataTransfer) || dropTargetFor(event.target) !== id)
        return;
      event.preventDefault();
      event.stopPropagation();
      const files = filesFromTransfer(event.dataTransfer);
      reset();
      if (files.length > 0) addFiles.current(files);
    };
    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("dragover", onOver);
    document.addEventListener("drop", onDrop);
    return () => {
      reset();
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [enabled, id]);

  useEffect(() => {
    if (!dragging) return;
    const reset = () => {
      depth.current = 0;
      setDragging(false);
    };
    const events = ["drop", "dragend", "pointermove", "pointerdown"] as const;
    for (const name of events) window.addEventListener(name, reset, true);
    return () => {
      for (const name of events) window.removeEventListener(name, reset, true);
    };
  }, [dragging]);

  return { dragging, activate: () => activateDropTarget(id) };
}
