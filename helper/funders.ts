"use server"

import { createClient } from "@/lib/supabase/server";
import { Funder, CreateFunder, UpdateFunder } from "@/types/funder";
import { revalidatePath } from "next/cache";

export async function getFunders(): Promise<Funder[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("funders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching funders:", error);
        return [];
    }
    return data as Funder[];
}

export async function getFunderById(id: string): Promise<Funder | null> {
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
    return data as Funder;
}

export async function createFunder(formData: CreateFunder) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("funders")
        .insert([formData])
        .select();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/funders");
    return data;
}

export async function updateFunder(id: string, formData: UpdateFunder) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funders")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/funders");
  return data;
}

export async function deleteFunder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funders")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
    revalidatePath("/dashboard/funders");
    return true;
}

