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
    console.error("Error fetching credentials:", error.message, error.details, error.hint);
    return [];
  }
  console.log(`[getCredentials] Returned ${data?.length ?? 0} records`);
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
    console.error("Error creating credential:", credError.message, credError.details, credError.hint);
    throw new Error(credError.message);
  }
  console.log("[createCredential] Created:", credential);

  // Auto-link this credential to all packages that belong to the selected account
  if (account_id) {
    // First, try linking by package.account_id
    const { data: linkedPackages, error: linkError } = await supabase
      .from("package")
      .update({ credential_id: credential.id })
      .eq("account_id", account_id)
      .select("id");

    if (linkError) {
      console.error("Error auto-linking credential to packages:", linkError);
    }

    // Fallback: if no packages were linked (account_id not set on packages yet),
    // find packages through funder_account.user → funder_account.package_id
    if (!linkedPackages || linkedPackages.length === 0) {
      console.log("[createCredential] No packages with account_id found, trying funder_account fallback");
      const { data: funderAccounts } = await supabase
        .from("funder_account")
        .select("package_id")
        .eq("user", account_id);

      if (funderAccounts && funderAccounts.length > 0) {
        const packageIds = funderAccounts.map((fa: any) => fa.package_id).filter(Boolean);
        if (packageIds.length > 0) {
          await supabase
            .from("package")
            .update({ credential_id: credential.id, account_id: account_id })
            .in("id", packageIds);
          console.log("[createCredential] Linked credential via funder_account fallback to packages:", packageIds);
        }
      }
    }
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  revalidatePath("/dashboard/funders/packages");
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

  // Auto-link this credential to all packages that belong to the selected account
  if (account_id) {
    // First, unlink this credential from any old packages it was previously assigned to
    await supabase
      .from("package")
      .update({ credential_id: null })
      .eq("credential_id", id);

    // Then, link by package.account_id
    const { data: linkedPackages, error: linkError } = await supabase
      .from("package")
      .update({ credential_id: id })
      .eq("account_id", account_id)
      .select("id");

    if (linkError) {
      console.error("Error auto-linking credential to packages on update:", linkError);
    }

    // Fallback: if no packages were linked, find packages through funder_account
    if (!linkedPackages || linkedPackages.length === 0) {
      console.log("[updateCredential] No packages with account_id found, trying funder_account fallback");
      const { data: funderAccounts } = await supabase
        .from("funder_account")
        .select("package_id")
        .eq("user", account_id);

      if (funderAccounts && funderAccounts.length > 0) {
        const packageIds = funderAccounts.map((fa: any) => fa.package_id).filter(Boolean);
        if (packageIds.length > 0) {
          await supabase
            .from("package")
            .update({ credential_id: id, account_id: account_id })
            .in("id", packageIds);
          console.log("[updateCredential] Linked credential via funder_account fallback to packages:", packageIds);
        }
      }
    }
  }

  revalidatePath("/dashboard/trading-accounts/credentials");
  revalidatePath("/dashboard/funders/packages");
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
