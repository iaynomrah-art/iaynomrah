export interface Account {  
  id: number;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string;
  address: string;
  city: string;
  




  zip_code: number;
  contact_number: number;
  contact_number_2: number | null;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  id_type: string;
  billing: string | null;
}

export type CreateAccount = Omit<Account, "id" | "created_at">;
export type UpdateAccount = Partial<CreateAccount>;
