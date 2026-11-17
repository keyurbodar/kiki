import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { PlusGlyph } from "../ui/glyphs.tsx";
import { GitHubPluginSheet } from "./github-plugin-sheet.tsx";

const itemIcon =
  "grid size-(--icon-base) place-items-center [&_svg]:size-(--icon-sm)";

export function AddMenu() {
  const navigate = useNavigate();
  const [githubOpen, setGithubOpen] = useState(false);
  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Add" title="Add">
              <PlusGlyph />
            </Button>
          }
        />
        <MenuContent align="end" className="w-56">
          <MenuItem
            onClick={() => void navigate({ to: "/settings/mcp/marketplace" })}
          >
            <span className={itemIcon}>
              <Icon name="store-1" />
            </span>
            From marketplace
          </MenuItem>
          <MenuItem onClick={() => setGithubOpen(true)}>
            <span className={itemIcon}>
              <Icon name="github" />
            </span>
            From GitHub repository
          </MenuItem>
          <MenuItem onClick={() => void navigate({ to: "/settings/mcp/new" })}>
            <span className={itemIcon}>
              <Icon name="server-2" />
            </span>
            MCP server
          </MenuItem>
        </MenuContent>
      </Menu>
      <GitHubPluginSheet open={githubOpen} onOpenChange={setGithubOpen} />
    </>
  );
}
