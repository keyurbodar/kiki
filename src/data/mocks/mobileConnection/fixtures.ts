import { MobileConnection } from "../../api/schemas/mobile-connection.ts";

export const sampleMobileConnection = new MobileConnection({
  configured: true,
  accessGranted: false,
  available: false,
  disabledAt: null,
  state: null,
  connectedAt: null,
  revylOrgName: null,
  billedBy: null,
  ownerName: null,
  approval: null,
  approvalOutcome: null,
  supportReference: null,
});
