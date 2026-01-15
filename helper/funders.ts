import { createClient } from "@/lib/supabase/server";

export async function getFunders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funders:", error);
    return [];
  }
  return data;
}

export async function getFunderById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching funder:", error);
    return null;
  }
  return data;
}

export async function createFunder(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateFunder(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteFunder(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funders")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function fundersTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .select("id, name, allias, reset_time")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funders table data:", error);
    return [];
  }
  return data;
}
