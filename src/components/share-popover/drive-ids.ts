import { Option, Schema } from "effect";
import {
  type DriveShareId,
  DriveShareId as DriveShareIdSchema,
  type VolumeId,
  VolumeId as VolumeIdSchema,
} from "@/data/api/schemas/drive";

// A share link that does not carry a well-formed id is not a share kiki can ask
// the API about, so the visitors of such a link see the unavailable state.
export const volumeIdOf = (value: string): VolumeId | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(VolumeIdSchema)(value));

export const driveShareIdOf = (value: string): DriveShareId | undefined =>
  Option.getOrUndefined(Schema.decodeUnknownOption(DriveShareIdSchema)(value));
