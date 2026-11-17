# features/composer/attachments

Owner: B4 (b4-composer-attachments). Composer attachments: file picker, paste, page-wide drop zone, upload with progress, chips (uploading, settled, failed), preview and remove. Ported from Capy's `shared/composer/composer.tsx` (`AttachmentStrip`, the drop overlay and its attachment hook) and the files upload flow.

## Contract for the composer (src/components/composer)

```tsx
const uploader = useFileUploader(orgId); // undefined → attachments off
const attachments = useComposerAttachments(uploader, initialRefs);

<Composer
  attachments={<ComposerAttachments attachments={attachments} />}
  onFilesAdded={attachments.add}
/>;
```

- **`attachments` slot.** Render it inside the composer root (`data-slot="composer"`), after the editor. It brings the chip strip, a hidden `<input type="file" multiple>` and the drop overlay. Capy's "Attach files" toolbar action (`composer.attach`) clicks `root.querySelector("input[type='file']")`, which finds this input.
- **`onFilesAdded`** is `attachments.add`. Picker and drop call it from inside this unit. The composer calls it on paste: in its `onPasteCapture`, call `handleAttachmentPaste(event, onFilesAdded)`. A `"text"` result means "paste `text` as plain text into the editor" and, when `files` is non-empty, show the `pastedAsTextToast` (info toast "Pasted as text" with an "Attach image" action that calls `onFilesAdded(files)`).
- **Sending.** `attachments.getReadyRefs()` gives the `files` for the send. Capy blocks submit while `attachments.uploading`, unless the composer allows `submitWhileUploading`, in which case it calls `take()` and hands the pending uploads to the queued send. After a send, call `clearSent()`. `restore(refs)` and `reset(refs?)` put a queued or edited message's files back.
- **Drops.** With several composers mounted, a drop goes to the one under the pointer, else the one last focused or pressed (`drop-targets.ts`). Pass `captureDrops={false}` to opt out.

## Uploads

`useFileUploader(orgId)` calls `POST /orgs/:orgId/files` through the A3 client (`data/atoms/files.ts`), then PUTs each file to its presigned target with progress. A target on a `.invalid` host (what `FilesMock` hands out) is a local upload, exactly as in Capy: no PUT, and progress is simulated only when localStorage `capy-upload-fixture` is `slow` or `fail` (fail stops at 60%).

Limits and copy come from the bundle: 250 MB per file ("Over the 250 MB file limit"), 2 GiB per message ("Over the 2 GiB total limit"), "Empty file", "Upload unavailable".

## Upload send failure

`../upload-send-failure` is the line under a sent user message whose uploads failed: reason, Retry, Edit (`data-slot="upload-send-failure"`). It has no Doop frame; built from the bundle.

## Preview harness

`preview/index.html?state=uploading|settled|failed|files-2|single|drag-over|send-failure` on the dev server. Dev only, not a route.
