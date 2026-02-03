import { Funder } from "./funder";

export interface Package {
  id: string; // Changed from number to string
  created_at: string;
  name: string | null;
  balance: number | null;
  phase: PackagePhase | null;
  symbol: string | null;
  funder_id: string | null; // Changed from number to string
  funder?: Funder;
  funders?: Funder; // Added for plural join result
  is_used?: boolean;
}

export type CreatePackage = Omit<Package, "id" | "created_at" | "funder">;
export type UpdatePackage = Partial<CreatePackage>;

export type PackagePhase = "phase 1" | "phase 2" | "live" | string;
