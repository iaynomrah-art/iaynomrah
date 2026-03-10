export interface Credential {
  id: string;
  created_at: string;
  password: string | null;
  username: string | null;
  platform: string | null;
  platform_id: string | null;
  name?: string;

  // Joined fields
  package?: Array<{
    id: string;
    funder_id?: string;
    account_id?: string;
    account?: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
    funders?: {
      id: string;
      name: string;
      allias: string;
      allias_color: string;
      text_color: string;
    } | null;
  }> | null;
}

export type CreateCredential = Omit<Credential, "id" | "created_at">;
export type UpdateCredential = Partial<CreateCredential>;
