import { Franchise } from "./franchise";

export interface Unit {
  id: number;
  created_at: string;
  unit_id: string; // uuid
  unit_name: string;
  archived: boolean;
  api_base_url: string | null;
  status: UnitStatus | null; // USER-DEFINED
  franchise_id: number | null;
  franchise?: Franchise;
}

export type CreateUnit = Omit<Unit, "id" | "created_at" | "unit_id" | "franchise">;
export type UpdateUnit = Partial<CreateUnit>;

export type UnitStatus = "enabled" | "disabled" | "processing" | "slow network" | "not connected" | "pc issue";