export const treeStyles = `
[data-item-section="content"] {
  --truncate-marker-background-color: var(--capy-file-tree-surface);
  font-weight: var(--trees-font-weight-regular);
}
:host([data-tree-filtered="true"]) [data-item-type="file"] [data-item-section="content"] {
  font-weight: var(--font-weight-medium);
}
[data-item-section="decoration"],
[data-item-git-status] > [data-item-section="git"] {
  font-weight: var(--trees-font-weight-regular);
  font-variant-numeric: tabular-nums;
}
[data-item-section="decoration"] {
  flex: 1 0 auto;
}
[data-item-section="decoration"] > span {
  display: inline-flex;
  column-gap: var(--spacing);
}
[data-item-section="content"] + [data-item-section="git"] {
  margin-left: auto;
}
[data-item-flattened-subitem]:not(:last-child)::after {
  content: "/";
  flex: none;
  margin: 0 0.4em;
}
[data-item-type="folder"]:not([data-item-selected="true"]) [data-item-section="content"] {
  color: var(--trees-fg-muted);
}
[data-item-contains-git-change="true"] > [data-item-section="git"] {
  display: none;
}
[aria-expanded][data-item-type="folder"] > [data-item-section="icon"] {
  align-self: stretch;
  position: relative;
}
[aria-expanded][data-item-type="folder"] > [data-item-section="icon"] > [data-icon-name="file-tree-icon-chevron"] {
  transform: none;
}
[aria-expanded="true"][data-item-type="folder"] > [data-item-section="icon"] > [data-icon-name="file-tree-icon-chevron"] {
  --capy-folder-closed-opacity: 0;
  --capy-folder-open-opacity: 1;
}
[data-item-section="spacing"] {
  padding-left: 0;
  margin-right: calc(-1 * var(--trees-item-row-gap));
}
[data-item-section="spacing"]:empty {
  margin-right: 0;
}
[data-item-section="spacing-item"],
[data-item-section="spacing-item"] + [data-item-section="spacing-item"] {
  width: var(--hairline);
  opacity: 1;
  border-left: 0;
  background: var(--trees-indent-guide-bg);
  margin-left: calc(var(--trees-icon-width) / 2);
  margin-right: calc(var(--capy-tree-indent) - var(--hairline) - var(--trees-icon-width) / 2);
  transform: none;
}
:host([data-tree-surface="popover"]) [data-file-tree-virtualized-scroll="true"],
:host([data-tree-fit="true"]) [data-file-tree-virtualized-scroll="true"] {
  --trees-scrollbar-gutter-measured: 0;
  scrollbar-gutter: auto;
}
:host([data-tree-surface="popover"]) [data-file-tree-virtualized-list="true"],
:host([data-tree-fit="true"]) [data-file-tree-virtualized-list="true"] {
  padding-block: 0;
}
`;
