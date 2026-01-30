export interface Franchise {
  id: string;
  created_at: string;
  name: string | null;
  code: string | null;
  investor_name: string | null;
  description: string | null;
}

export type CreateFranchise = Omit<Franchise, "id" | "created_at">;
export type UpdateFranchise = Partial<CreateFranchise>;
