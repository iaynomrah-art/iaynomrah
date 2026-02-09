export interface PlatformId {
  id: string;
  created_at: string;
  platform: string | null;
  platform_id: string | null;
  credentials_id: string | null;
}

export type CreatePlatformId = Omit<PlatformId, "id" | "created_at">;
export type UpdatePlatformId = Partial<CreatePlatformId>;
