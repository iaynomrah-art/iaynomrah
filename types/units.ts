import { Franchise } from "./franchise";

export interface Unit {
  id: string;
  created_at: string;
  unit_id: string; // uuid
  unit_name: string;

  archived: boolean;
  api_base_url: string | null;
  status: UnitStatus | null; // USER-DEFINED
  franchise_id: string | null;
  franchise?: Franchise;
  is_occupied: boolean;
  mobile_number: string | null;
  public_ip?: string | null;
  isp?: string | null;
  ip_updated_at?: string | null;
}

export type CreateUnit = Omit<
  Unit,
  "id" | "created_at" | "unit_id" | "franchise"
>;
export type UpdateUnit = Partial<CreateUnit>;

// Stored in unit_router_credentials; super-admin only (lib/router-actions.ts)
export interface RouterCredentials {
  router_username: string | null;
  router_password: string | null;
  gomo_email: string | null;
  gomo_password: string | null;
  updated_at: string | null;
}

export type UnitStatus =
  | "enabled"
  | "disabled"
  | "processing"
  | "slow network"
  | "not connected"
  | "pc issue";
