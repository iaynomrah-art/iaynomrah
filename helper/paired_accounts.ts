"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreatePairedAccountDTO, UpdatePairedAccountDTO } from "@/types/paired";

export async function getPairedAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .select(
      `
      *,
      primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(
        *, 
        funder_account:funder_account_id(
            *, 
            package_ref:package!funder_account_package_id_fkey(*, funders(*)), 
            accounts:accounts!funder_account_acount_id_fkey(*, units(*)), 
            credentials:credentials!funder_account_credential_id_fkey(*)
        )
      ),
      secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(
        *, 
        funder_account:funder_account_id(
            *, 
            package_ref:package!funder_account_package_id_fkey(*, funders(*)), 
            accounts:accounts!funder_account_acount_id_fkey(*, units(*)), 
            credentials:credentials!funder_account_credential_id_fkey(*)
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching paired accounts:", error);
    return [];
  }

  return data.map((pair: any) => ({
    ...pair,
    primary_account: pair.primary_account
      ? {
          ...(pair.primary_account.funder_account || {}),
          ...pair.primary_account,
          status: pair.primary_account.account_status,
          package_ref: pair.primary_account.funder_account?.package_ref,
          accounts: pair.primary_account.funder_account?.accounts,
          credentials: pair.primary_account.funder_account?.credentials,
        }
      : null,
    secondary_account: pair.secondary_account
      ? {
          ...(pair.secondary_account.funder_account || {}),
          ...pair.secondary_account,
          status: pair.secondary_account.account_status,
          package_ref: pair.secondary_account.funder_account?.package_ref,
          accounts: pair.secondary_account.funder_account?.accounts,
          credentials: pair.secondary_account.funder_account?.credentials,
        }
      : null,
  }));
}

export async function getPairedAccountById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .select(
      `
      *,
      primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(*, funder_account:funder_account_id(*)),
      secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching paired account:", error);
    return null;
  }

  const pair = data as any;
  return {
    ...pair,
    primary_account: pair.primary_account
      ? {
          ...(pair.primary_account.funder_account || {}),
          ...pair.primary_account,
        }
      : null,
    secondary_account: pair.secondary_account
      ? {
          ...(pair.secondary_account.funder_account || {}),
          ...pair.secondary_account,
        }
      : null,
  };
}

export async function createPairedAccount(formData: CreatePairedAccountDTO) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/paired-accounts");
  return data;
}

export async function updatePairedAccount(
  id: string,
  formData: UpdatePairedAccountDTO,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/paired-accounts");
  return data;
}

export async function deletePairedAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("paired_trading_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/paired-accounts");
  return true;
}

export async function realTimeGetPairedAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .select(
      `
          *,
          primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(
            *, 
            funder_account:funder_account_id(
                *, 
                package_ref:package!funder_account_package_id_fkey(*, funders(*)), 
                accounts:accounts!funder_account_acount_id_fkey(*, units(*)), 
                credentials:credentials!funder_account_credential_id_fkey(*)
            )
          ),
          secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(
            *, 
            funder_account:funder_account_id(
                *, 
                package_ref:package!funder_account_package_id_fkey(*, funders(*)), 
                accounts:accounts!funder_account_acount_id_fkey(*, units(*)), 
                credentials:credentials!funder_account_credential_id_fkey(*)
            )
          )
        `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching paired accounts:", error);
    return [];
  }

  return data.map((pair: any) => ({
    ...pair,
    primary_account: pair.primary_account
      ? {
          ...(pair.primary_account.funder_account || {}),
          ...pair.primary_account,
          status: pair.primary_account.account_status,
          package_ref: pair.primary_account.funder_account?.package_ref,
          accounts: pair.primary_account.funder_account?.accounts,
          credentials: pair.primary_account.funder_account?.credentials,
        }
      : null,
    secondary_account: pair.secondary_account
      ? {
          ...(pair.secondary_account.funder_account || {}),
          ...pair.secondary_account,
          status: pair.secondary_account.account_status,
          package_ref: pair.secondary_account.funder_account?.package_ref,
          accounts: pair.secondary_account.funder_account?.accounts,
          credentials: pair.secondary_account.funder_account?.credentials,
        }
      : null,
  }));
}
