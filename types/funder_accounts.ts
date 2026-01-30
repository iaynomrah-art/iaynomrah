import { Account } from "./accounts";
import { Credential } from "./credentials";
import { Package } from "./package";
import { Unit } from "./units";
import { Funder } from "./funder";

export type AccountStatus =
  | "idle"
  | "trading"
  | "paired"
  | "abs"
  | "brc"
  | "brc-check"
  | "waiting"
  | "oh"
  | "kyc"
  | "for payout";
export interface FunderAccount {
  id: string;
  created_at: string;
  package_id: string | null;
  status: AccountStatus;
  acount_id: string | null;
  credential_id: string | null;

  // Joined fields
  package?: Package & { funders?: Funder };
  accounts?: (Account & { units?: Unit | null }) | null;
  credentials?: Credential | null;
}

export type CreateFunderAccount = Omit<
  FunderAccount,
  "id" | "created_at" | "package" | "account" | "credential" | "unit"
>;
export type UpdateFunderAccount = Partial<CreateFunderAccount>;
