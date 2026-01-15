import { Funder } from "./funder";

export interface Package {
  id: number;
  created_at: string;
  name: string | null;
  balance: number | null;
  phase: PackagePhase | null;
  instrument: string | null;
  funder_id: number | null;
  funder?: Funder;
}

export type CreatePackage = Omit<Package, "id" | "created_at" | "funder">;
export type UpdatePackage = Partial<CreatePackage>;

export type PackagePhase = "phase 1" | "phase 2" | "live" | string;
