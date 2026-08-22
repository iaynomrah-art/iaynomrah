export interface Credential {
  id: string;
  created_at: string;
  password: string | null;
  username: string | null;
  platform?: string;
  platform_id?: string;
  server?: string;
  mt5_url?: string;
  name?: string;
  account_id?: string;
  accounts?: any;

  // Joined fields
  package?: Array<{
    id: string;
    funder_id?: string;
    account_id?: string;
    accounts?: Array<{
      id: string;
      first_name: string;
      last_name: string;
    }> | { id: string; first_name: string; last_name: string } | null;
    funders?: Array<{
      id: string;
      name: string;
      allias: string;
      allias_color: string;
      text_color: string;
    }> | { id: string; name: string; allias: string; allias_color: string; text_color: string } | null;
  }> | null;
}

export type CreateCredential = Omit<Credential, "id" | "created_at">;
export type UpdateCredential = Partial<CreateCredential>;
