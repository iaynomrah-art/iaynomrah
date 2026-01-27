"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreatePairedAccountDTO, UpdatePairedAccountDTO } from "@/types/paired";

export async function getPairedAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .select(`
      *,
      primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(*, funders(*), units(*), package(*), credentials(*)),
      secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(*, funders(*), units(*), package(*), credentials(*)),
      primary_unit:units!paired_trading_accounts_primary_unit_id_fkey(*),
      secondary_unit:units!paired_trading_accounts_secondary_unit_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching paired accounts:", error);
    return [];
  }


  return data;
}

export async function getPairedAccountById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paired_trading_accounts")
    .select(`
      *,
      primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(*),
      secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching paired account:", error);
    return null;
  }
  return data;
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

export async function updatePairedAccount(id: string, formData: UpdatePairedAccountDTO) {
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
        .select(`
          *,
          primary_account:trading_accounts!paired_trading_accounts_primary_account_fkey(*, funders(*), units(*), package(*), credentials(*)),
          secondary_account:trading_accounts!paired_trading_accounts_secondary_account_fkey(*, funders(*), units(*), package(*), credentials(*)),
          primary_unit:units!paired_trading_accounts_primary_unit_id_fkey(*),
          secondary_unit:units!paired_trading_accounts_secondary_unit_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching paired accounts:", error);
        return [];
    }


    return data;
}