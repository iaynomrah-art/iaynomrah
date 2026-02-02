"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTradingAccounts(type?: string) {
  const supabase = await createClient();

  let query = supabase.from("trading_accounts").select(`
    *,
    funder_account:funder_account_id(
      *,
      package_ref:package!funder_account_package_id_fkey(*, funders(*)),
      accounts:accounts!funder_account_acount_id_fkey(*, units:unit_id(*)),
      credentials:credentials!funder_account_credential_id_fkey(*)
    )
  `);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trading accounts:", error);
    return [];
  }

  // console.log(JSON.stringify(data, null, 2));

  // Flatten the data to maintain compatibility with existing components
  return data.map((item: any) => ({
    ...(item.funder_account || {}),
    ...item,
    status: item.account_status || item.funder_account?.status || "idle",
    id: item.id,
    package_ref: Array.isArray(item.funder_account?.package_ref)
      ? item.funder_account.package_ref[0]
      : item.funder_account?.package_ref,
    accounts: Array.isArray(item.funder_account?.accounts)
      ? item.funder_account.accounts[0]
      : item.funder_account?.accounts,
    credentials: Array.isArray(item.funder_account?.credentials)
      ? item.funder_account.credentials[0]
      : item.funder_account?.credentials,
  }));
}

export async function getTradingAccountById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trading_accounts")
    .select(
      `
      *,
      funder_account:funder_account_id(
        *,
        package_ref:package!funder_account_package_id_fkey(*, funders(*)),
        accounts:accounts!funder_account_acount_id_fkey(*, units:unit_id(*)),
        credentials:credentials!funder_account_credential_id_fkey(*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching trading account:", error);
    return null;
  }

  // Flatten the data
  const item = data as any;
  return {
    ...(item.funder_account || {}),
    ...item,
    status: item.account_status || item.funder_account?.status || "idle",
    id: item.id,
    package_ref: Array.isArray(item.funder_account?.package_ref)
      ? item.funder_account.package_ref[0]
      : item.funder_account?.package_ref,
    accounts: Array.isArray(item.funder_account?.accounts)
      ? item.funder_account.accounts[0]
      : item.funder_account?.accounts,
    credentials: Array.isArray(item.funder_account?.credentials)
      ? item.funder_account.credentials[0]
      : item.funder_account?.credentials,
  };
}

export async function createTradingAccount(formData: any) {
  const supabase = await createClient();

  // If package_id is provided, fetch the package name/details if needed to populate the 'package' text column
  if (formData.package_id && !formData.package) {
    const { data: packageData } = await supabase
      .from("package")
      .select("name")
      .eq("id", formData.package_id)
      .single();

    if (packageData) {
      formData.package = packageData.name;
    }
  }

  const { data, error } = await supabase
    .from("funder_account")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function updateTradingAccount(id: string, formData: any) {
  const supabase = await createClient();

  // If package_id is being updated, fetch the new package's name
  if (formData.package_id !== undefined && !formData.package) {
    const { data: packageData } = await supabase
      .from("package")
      .select("name")
      .eq("id", formData.package_id)
      .single();

    if (packageData) {
      formData.package = packageData.name;
    }
  }

  const { data, error } = await supabase
    .from("funder_account")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function deleteTradingAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("funder_account").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return true;
}

/**
 * Sync all funder accounts' packages with their associated packages
 */
export async function syncAllTradingAccountPhases() {
  const supabase = await createClient();

  // Get all accounts with package_id
  const { data: tradingAccounts, error: fetchError } = await supabase
    .from("funder_account")
    .select(
      "id, package_id, package, package_ref:package!funder_account_package_id_fkey(name)",
    )
    .not("package_id", "is", null);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Update each account where package name doesn't match
  const updates =
    tradingAccounts
      ?.filter(
        (ta: any) => ta.package_ref?.name && ta.package !== ta.package_ref.name,
      )
      .map((ta: any) =>
        supabase
          .from("funder_account")
          .update({ package: ta.package_ref.name })
          .eq("id", ta.id),
      ) || [];

  if (updates.length > 0) {
    await Promise.all(updates);
    revalidatePath("/dashboard/trading-accounts");
  }

  return { synced: updates.length };
}
