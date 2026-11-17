import { UserId } from "../../api/schemas/ids.ts";
import { UserProfile } from "../../api/schemas/user.ts";
import { minutesAgo } from "../fixtures/time.ts";

export const sampleUser = new UserProfile({
  id: UserId.make("user_sample_alex"),
  email: "alex@example.com",
  firstName: "Alex",
  lastName: "Morgan",
  imageUrl: null,
  superadmin: false,
  preferences: {},
  clientAppearance: undefined,
  onboardedAt: minutesAgo(60 * 24 * 30),
  createdAt: minutesAgo(60 * 24 * 31),
  updatedAt: minutesAgo(60 * 24),
});
