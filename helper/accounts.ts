"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, units(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getAccountById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }
  return data;
}

export async function createAccount(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/user-accounts");
  return data;
}

export async function updateAccount(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/user-accounts");
  return data;
}

export async function deleteAccount(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/user-accounts");
  return true;
}


export async function accountsTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      units(unit_name),
      funder_accounts:funder_account(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts table data:", error);
    return [];
  }
  return data;
}
