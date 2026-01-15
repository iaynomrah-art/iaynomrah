import { createClient } from "@/lib/supabase/server";

export async function getFranchises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("franchise")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching franchises:", error);
    return [];
  }
  return data;
}

export async function getFranchiseById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("franchise")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching franchise:", error);
    return null;
  }
  return data;
}

export async function createFranchise(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("franchise")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateFranchise(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("franchise")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteFranchise(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("franchise")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}
