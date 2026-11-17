import { type ReactNode, useContext, useState } from "react";
import {
  FileToolbarButton,
  FileToolbarSlotContext,
} from "@/components/file-toolbar";
import { Icon } from "@/primitives/icon";
import { CopyMenu } from "./copy-menu";
import type { FileHome, FileVersions } from "./file-content";
import {
  DiffWrapContext,
  FileCopyTextContext,
  FileHeaderLeadContext,
  FileSourceModeContext,
  FileViewportContext,
  type ViewportHandler,
} from "./file-context";
import { CrumbSeparator, FileCrumbs } from "./file-crumbs";
import { hasRenderedView, isSvg } from "./file-kind";
import { FileLoading } from "./file-loading";
import { FileMenu } from "./file-menu";
import { FileView } from "./file-view";
import { initialCompare, VersionPicker } from "./version-picker";

const track = (owner: string) =>
  `shared/files/file-view.tsx#FileChrome:${owner}`;

export type FileChromeProps = {
  home: FileHome;
  path: string;
  name: string;
  meta?: string;
  leading?: ReactNode;
  headerAction?: ReactNode;
  trailing?: ReactNode;
  onCrumb?: (path: string) => void;
  copyPath?: string | false;
  link?: string;
  onDownload?: () => void;
  download?: boolean;
  onOpenDiffs?: () => void;
  defaultRendered?: boolean;
  versions?: FileVersions;
  onViewport?: ViewportHandler;
  actions?: ReactNode;
  wrap?: boolean;
  onWrapChange?: (wrap: boolean) => void;
  children: (rendered: boolean) => ReactNode;
};

const noViewport: ViewportHandler = () => {};

export function FileChrome({
  home,
  path,
  name,
  meta,
  leading,
  headerAction,
  trailing,
  onCrumb,
  copyPath = path,
  link,
  onDownload,
  download,
  onOpenDiffs,
  defaultRendered = true,
  versions,
  onViewport,
  actions,
  wrap: wrapProp,
  onWrapChange,
  children,
}: FileChromeProps) {
  const headerLead = useContext(FileHeaderLeadContext);
  const [rendered, setRendered] = useState(defaultRendered);
  const [sourceMode, setSourceMode] = useState(false);
  const [copyText, setCopyText] = useState<string>();
  const [comparing, setComparing] = useState<{ base: string; head: string }>();
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  const [localWrap, setLocalWrap] = useState(false);
  const wrap = wrapProp ?? localWrap;
  const setWrap = (next: boolean) => {
    setLocalWrap(next);
    onWrapChange?.(next);
  };
  const crumbPath = path.replace(/^\/+/, "");
  const list = versions?.list ?? [];
  const compare =
    versions?.compare !== undefined && list.length > 1
      ? versions.compare
      : undefined;
  const range = compare === undefined ? undefined : comparing;
  const renderable = hasRenderedView(name);

  return (
    <FileView>
      <div
        className="flex h-9 shrink-0 items-center gap-1.5 border-b-hairline border-border-1 px-2"
        data-file-header=""
      >
        {headerLead}
        {leading}
        {range === undefined ? (
          <FileCrumbs
            home={home}
            path={crumbPath}
            name={name}
            meta={meta}
            onCrumb={onCrumb}
            version={
              versions === undefined || list.length < 2
                ? undefined
                : {
                    label:
                      list.find((version) => version.value === versions.current)
                        ?.label ?? "Version",
                    render: (compact) => (
                      <VersionPicker
                        list={list}
                        value={versions.current}
                        label="Version"
                        compact={compact}
                        onPick={versions.onPick}
                      />
                    ),
                  }
            }
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center">
            <span className="ml-1 min-w-8 shrink truncate text-xs text-muted-foreground-1">
              {name}
            </span>
            <CrumbSeparator />
            <VersionPicker
              list={list}
              value={range.base}
              label="Compare from"
              onPick={(base) => setComparing({ ...range, base })}
            />
            <Icon
              name="chevron-right"
              size="xs"
              className="mx-1.5 shrink-0 text-muted-foreground-3"
            />
            <VersionPicker
              list={list}
              value={range.head}
              label="Compare to"
              onPick={(head) => setComparing({ ...range, head })}
            />
          </div>
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          {range === undefined && (
            <div ref={setToolbar} className="flex items-center gap-0.5" />
          )}
          {trailing}
          {renderable && range === undefined && (
            <FileToolbarButton
              data-track-owner={track("FileToolbarButton.1")}
              label={
                rendered
                  ? "View source"
                  : isSvg(name)
                    ? "View image"
                    : "View rendered"
              }
              pressed={!rendered}
              onClick={() => setRendered(!rendered)}
            >
              <Icon name="code-brackets" size="sm" />
            </FileToolbarButton>
          )}
          {compare !== undefined && versions !== undefined && (
            <FileToolbarButton
              data-track-owner={track("FileToolbarButton.2")}
              label={
                range === undefined ? "Compare versions" : "Stop comparing"
              }
              pressed={range !== undefined}
              onClick={() =>
                setComparing(
                  range === undefined
                    ? initialCompare(list, versions.current)
                    : undefined,
                )
              }
            >
              <Icon name="arrow-left-right" size="sm" />
            </FileToolbarButton>
          )}
          <CopyMenu copyPath={copyPath} text={copyText} link={link} />
          {headerAction}
          {(download === true || onDownload !== undefined) && (
            <FileToolbarButton
              data-track-owner={track("FileToolbarButton[Download]")}
              label="Download"
              disabled={onDownload === undefined}
              onClick={() => onDownload?.()}
            >
              <Icon name="cloud-download" size="sm" />
            </FileToolbarButton>
          )}
          <FileMenu
            actions={actions}
            onOpenDiffs={onOpenDiffs}
            wrap={sourceMode || range !== undefined}
          />
        </div>
      </div>
      <DiffWrapContext.Provider value={{ wrap, setWrap }}>
        <FileSourceModeContext.Provider value={setSourceMode}>
          <FileCopyTextContext.Provider value={setCopyText}>
            <FileViewportContext.Provider value={onViewport ?? noViewport}>
              <FileToolbarSlotContext.Provider value={toolbar}>
                {range === undefined || compare === undefined
                  ? children(rendered)
                  : compare(range.base, range.head)}
              </FileToolbarSlotContext.Provider>
            </FileViewportContext.Provider>
          </FileCopyTextContext.Provider>
        </FileSourceModeContext.Provider>
      </DiffWrapContext.Provider>
    </FileView>
  );
}

export function FileChromeLoading() {
  const headerLead = useContext(FileHeaderLeadContext);
  return (
    <FileView>
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b-hairline border-border-1 px-2">
        {headerLead}
      </div>
      <FileLoading />
    </FileView>
  );
}
