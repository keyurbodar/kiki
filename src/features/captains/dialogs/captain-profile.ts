import { captainAvatarBackgrounds } from "@/tokens/captain-avatar";
import type { CaptainAvatarValue } from "./avatar";
import type { CaptainProfile, CaptainRole } from "./captain-dialog-model";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const strings = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value) ? value.filter((row) => typeof row === "string") : [];

const avatarOf = (value: unknown): CaptainAvatarValue | undefined => {
  if (!isRecord(value)) return undefined;
  const kind = value.kind === "emoji" ? "emoji" : "preset";
  const preset = text(value.value);
  if (preset === undefined || preset === "") return undefined;
  return {
    kind,
    value: preset,
    background: text(value.background) ?? captainAvatarBackgrounds[0].value,
    ...(text(value.image) === undefined ? {} : { image: text(value.image) }),
    ...(text(value.library) === undefined
      ? {}
      : { library: text(value.library) }),
  };
};

/**
 * The Captain row's Profile menu opens Capy's Captain dialog on its profile
 * page, and that dialog reads this shape. The endpoint is undecoded, so the
 * page reads it through this guard and shows nothing it cannot stand behind.
 */
export function captainProfileOf(
  value: unknown,
  viewer: { readonly projectName?: string; readonly userId?: string },
): CaptainProfile | undefined {
  if (!isRecord(value)) return undefined;
  const name = text(value.name);
  const ownerUserId = text(value.ownerId);
  if (name === undefined || ownerUserId === undefined) return undefined;
  const face = isRecord(value.face) ? value.face : {};
  const avatar = avatarOf(face.avatar);
  if (avatar === undefined) return undefined;
  const role: CaptainRole =
    viewer.userId !== undefined && viewer.userId === ownerUserId
      ? "owner"
      : "member";
  const ownerName = text(value.ownerName);
  return {
    name,
    alias: text(value.alias) ?? null,
    description: text(value.description) ?? null,
    avatar,
    projectId: text(value.projectId) ?? null,
    ...(viewer.projectName === undefined
      ? {}
      : { projectName: viewer.projectName }),
    ownerUserId,
    ...(ownerName === undefined ? {} : { ownerName }),
    archived: false,
    crew: strings(value.memberIds),
    crewDevice: null,
    viewerRole: role,
  };
}
