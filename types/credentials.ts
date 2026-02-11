import { PlatformId } from "./platform";

export interface Credential {
  id: string;
  created_at: string;
  password: string | null;
  username: string | null;
  name: string | null;
  platform?: string;
  platform_id?: string;
}

export type CreateCredential = Omit<Credential, "id" | "created_at">;
export type UpdateCredential = Partial<CreateCredential>;
