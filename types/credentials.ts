import { Account } from "./accounts";
import { Funder } from "./funder";

export interface Credential {
  id: number;
  created_at: string;
  user_id: number | null;
  funder_id: number | null;
  password: string | null;
  username: string | null;
  account?: Account;
  funder?: Funder;
}

export type CreateCredential = Omit<Credential, "id" | "created_at" | "account" | "funder">;
export type UpdateCredential = Partial<CreateCredential>;
