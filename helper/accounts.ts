import { createClient } from "@/lib/supabase/server";

export async function getAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts:", error);
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
    console.error("Error fetching account:", error);
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
  return true;
}


export async function accountsTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      funder_accounts:funder_account(
        unit:units(unit_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts table data:", error);
    return [];
  }
  return data;
}
