export interface Credential {
  id: string;
  created_at: string;
  password: string | null;
  username: string | null;
  name: string | null;
}

export type CreateCredential = Omit<Credential, "id" | "created_at">;
export type UpdateCredential = Partial<CreateCredential>;
