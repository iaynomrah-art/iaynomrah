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
      package:package(
        id,
        funder_id,
        account_id,
        funders(id, name, allias, allias_color, text_color),
        accounts:accounts(id, first_name, last_name)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "package", ascending: false });

  if (error) {
    console.error("Error fetching credentials:", error);
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
  const { account_id, funder_id, ...credentialData } = formData;

  const { data: credential, error: credError } = await supabase
    .from("credentials")
    .insert([credentialData])
    .select()
    .single();

  if (credError) {
    console.error("Error creating credential:", credError);
    throw new Error(credError.message);
  }

  // Handle Package link – the package table is the bridge between credential, account, and funder
  if (account_id || funder_id) {
    const { error: pkgError } = await supabase
      .from("package")
      .insert([
        {
          credential_id: credential.id,
          account_id: account_id || null,
          funder_id: funder_id || null,
          name: credentialData.name || "Auto-linked Package",
        },
      ]);

    if (pkgError) {
      console.error("Error creating associated package:", pkgError);
      // We don't throw here to avoid failing the whole process if package creation fails
    }
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  return credential;
}

export async function updateCredential(id: string, formData: any) {
  const supabase = await createClient();
  const { account_id, funder_id, ...credentialData } = formData;

  const { data: credential, error: credError } = await supabase
    .from("credentials")
    .update(credentialData)
    .eq("id", id)
    .select()
    .single();

  if (credError) {
    console.error("Error updating credential:", credError);
    throw new Error(credError.message);
  }

  // Handle Package link – the package table is the bridge between credential, account, and funder
  if (account_id || funder_id) {
    // Check if an existing package points to this credential
    const { data: existingPkg } = await supabase
      .from("package")
      .select("id")
      .eq("credential_id", id)
      .maybeSingle();

    if (existingPkg) {
      await supabase
        .from("package")
        .update({ account_id, funder_id })
        .eq("id", existingPkg.id);
    } else {
      await supabase.from("package").insert([
        {
          credential_id: id,
          account_id,
          funder_id,
          name: credentialData.name || "Auto-linked Package",
        },
      ]);
    }
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  return credential;
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
      package:package(
        id,
        funder_id,
        account_id,
        funders(id, name, allias, allias_color, text_color),
        accounts:accounts(id, first_name, last_name)
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
