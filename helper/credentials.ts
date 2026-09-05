"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Credential } from "@/types/credentials";

export async function getCredentials(): Promise<Credential[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(
      `
      id,
      created_at,
      username,
      password,
      platform,
      platform_id,
      account_id,
      accounts(*, units(*, franchise(*))),
      package:package(
        id,
        funder_id,
        account_id,
        funders(id, name, allias, allias_color, text_color),
        accounts:accounts(id, first_name, last_name),
        funder_account:funder_account(status)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "package", ascending: false });

  if (error) {
    console.error("Error fetching credentials:", error.message, error.details, error.hint);
    return [];
  }
  return data;
}

export async function getCredentialById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("id, created_at, username, password, platform, platform_id")
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
  const { funder_id, ...credentialData } = formData;
  const account_id = credentialData.account_id;

  const { data: credential, error: credError } = await supabase
    .from("credentials")
    .insert([credentialData])
    .select()
    .single();

  if (credError) {
    console.error("Error creating credential:", credError.message, credError.details, credError.hint);
    return { error: credError.message };
  }


  revalidatePath("/dashboard/trading-accounts/credentials");
  revalidatePath("/dashboard/funders/packages");
  return credential;
}

export async function updateCredential(id: string, formData: any) {
  const supabase = await createClient();
  const { funder_id, ...credentialData } = formData;
  const account_id = credentialData.account_id;

  const { data: credential, error: credError } = await supabase
    .from("credentials")
    .update(credentialData)
    .eq("id", id)
    .select()
    .single();

  if (credError) {
    console.error("Error updating credential:", credError);
    return { error: credError.message };
  }


  revalidatePath("/dashboard/trading-accounts/credentials");
  revalidatePath("/dashboard/funders/packages");
  return credential;
}

export async function deleteCredential(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("credentials").delete().eq("id", id);

  if (error) {
    console.error("Error deleting credential:", error.message);
    return { error: error.message };
  }
  revalidatePath("/dashboard/trading-accounts/credentials");
  return true;
}

export async function credentialsTable(): Promise<Credential[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select(
      `
      id,
      created_at,
      username,
      password,
      platform,
      platform_id,
      server,
      account_id,
      accounts(*, units(*, franchise(*))),
      package:package(
        id,
        funder_id,
        account_id,
        funders(id, name, allias, allias_color, text_color),
        accounts:accounts(id, first_name, last_name),
        funder_account:funder_account(status)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "package", ascending: false });

  if (error) {
    console.error("Error fetching credentials table data:", error);
    return [];
  }
  return data;
}
