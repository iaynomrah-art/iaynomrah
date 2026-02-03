"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPackages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package")
    .select("*, funders(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching packages:", error);
    return [];
  }

  return data;
}

export async function getPackageById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package")
    .select("*, funders(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching package:", error);
    return null;
  }
  return data;
}

export async function createPackage(formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/funders/packages");
  return data;
}

export async function updatePackage(id: string, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("package")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/funders/packages");
  return data;
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("package").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/dashboard/funders/packages");
  return true;
}

export async function packageTable() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("package").select(`
      id,
      name,
      balance,
      phase,
      symbol,
      funder:funders(name)
    `);

  if (error) {
    console.error("Error fetching package table data:", error);
    return [];
  }
  return data;
}
