"use server";

import { createClient } from "@/lib/supabase/server";
import {
  PlatformId,
  CreatePlatformId,
  UpdatePlatformId,
} from "@/types/platform";

export async function getPlatformIdsByCredentials(
  credentialsId: string,
): Promise<PlatformId[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_id")
    .select("*")
    .eq("credentials_id", credentialsId);

  if (error) {
    console.error("Error fetching platform IDs:", error);
    return [];
  }

  return data;
}

export async function createPlatformId(formData: CreatePlatformId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_id")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePlatformId(id: string, formData: UpdatePlatformId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_id")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
