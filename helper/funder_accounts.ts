"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFunderAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .select("*, user, package_name:package, funder, package(*, funders(*)), accounts(*, units(*)), credentials(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funder accounts:", error);
    return [];
  }
  return data;
}

export async function getFunderAccountById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .select("*, user, package_name:package, funder, package(*, funders(*)), accounts(*, units(*)), credentials(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching funder account:", error);
    return null;
  }
  return data;
}

export async function createFunderAccount(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return data;
}

export async function updateFunderAccount(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return data;
}

export async function deleteFunderAccount(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funder_account")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return true;
}

export async function funderAccountsTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .select(`
      id,
      status,
      created_at,
      user,
      package_name:package,
      funder,
      account_rel:accounts(id, first_name, last_name, email, units(unit_name)),
      package_rel:package(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funder accounts table data:", error);
    return [];
  }
  return data;
}
