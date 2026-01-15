import { createClient } from "@/lib/supabase/server";

export async function getUnits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, franchise(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching units:", error);
    return [];
  }
  return data;
}

export async function getUnitById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("*, franchise(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching unit:", error);
    return null;
  }
  return data;
}

export async function createUnit(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateUnit(id: number, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteUnit(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}
