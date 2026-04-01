import { Funder } from "./funder";
import { Account } from "./accounts";
import { Credential } from "./credentials";

export interface Package {
  id: string;
  created_at: string;
  name: string | null;
  balance: number | null;
  phase: PackagePhase | null;
  symbol: string | null;
  max_daily_loss: number | null;
  max_total_loss: number | null;
  profit_target: number | null;
  funder_id: string | null;
  funder?: Funder;
  funders?: Funder;
  is_used?: boolean;
  credential_id: string | null;
  account_id: string | null;
  credential?: Credential;
  account?: Account;
  profit_target?: number | null;
  max_daily_loss?: number | null;
  max_total_loss?: number | null;
}

export type CreatePackage = Omit<Package, "id" | "created_at" | "funder" | "credential" | "account">;
export type UpdatePackage = Partial<CreatePackage>;

export type PackagePhase = "phase 1" | "phase 2" | "live" | string;
