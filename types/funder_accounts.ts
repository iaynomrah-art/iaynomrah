import { Account } from "./accounts";
import { Credential } from "./credentials";
import { Package } from "./package";
import { Unit } from "./units";

export interface FunderAccount {
  id: number;
  created_at: string;
  package_id: number | null;
  status: boolean;
  acount_id: number | null;
  credential_id: number | null;
  unit_id: number | null;
  
  // Joined fields
  package?: Package;
  account?: Account;
  credential?: Credential;
  unit?: Unit;
}

export type CreateFunderAccount = Omit<FunderAccount, "id" | "created_at" | "package" | "account" | "credential" | "unit">;
export type UpdateFunderAccount = Partial<CreateFunderAccount>;
