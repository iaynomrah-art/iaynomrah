"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCredentials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(
      `
      *,
      funder_account!funder_account_credential_id_fkey(*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching credentials:", error);
    return [];
  }
  console.log(JSON.stringify(data, null, 2));
  return data;
}

export async function getCredentialById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching credential:", error);
    return null;
  }
  return data;
}

export async function createCredential(formData: any) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credentials")
    .insert([formData])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  return data;
}

export async function updateCredential(id: string, formData: any) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credentials")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  return data;
}

export async function deleteCredential(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("credentials").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/credentials");
  return true;
}

export async function credentialsTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(
      `
      id,
      name,
      username,
      password,
      platform,
      platform_id,
      funder_account!funder_account_credential_id_fkey(
        id,
        package(
          funders(name, allias, allias_color, text_color)
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching credentials table data:", error);
    return [];
  }
  return data;
}
