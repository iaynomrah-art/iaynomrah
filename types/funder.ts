export interface Funder {
  id: string;
  created_at: string;
  name: string | null;
  allias: string | null;
  reset_time: string | null;
  text_color: string | null;
  allias_color: string | null;
  automation: "API" | "GUI" | null;
}

export type CreateFunder = Omit<Funder, "id" | "created_at">;
export type UpdateFunder = Partial<CreateFunder>;
