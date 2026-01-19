"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTradingAccounts(type?: string) {
  const supabase = await createClient();
  let query = supabase.from("trading_accounts").select("*, funders(*), units(*), package(*)");
  
  if (type) {
    // Check if type matches phase or challenge_type
    query = query.or(`phase.ilike.%${type}%,challenge_type.ilike.%${type}%`);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trading accounts:", error);
    return [];
  }


  return data;
}

export async function getTradingAccountById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*, funders(*), units(*), package(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching trading account:", error);
    return null;
  }
  return data;
}

export async function createTradingAccount(formData: any) {
  const supabase = await createClient();
  
  // If package_id is provided, fetch the phase from the package
  if (formData.package_id) {
    const { data: packageData } = await supabase
      .from("package")
      .select("phase")
      .eq("id", formData.package_id)
      .single();
    
    if (packageData) {
      formData.phase = packageData.phase;
    }
  }
  
  const { data, error } = await supabase
    .from("trading_accounts")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function updateTradingAccount(id: number, formData: any) {
  const supabase = await createClient();
  
  // If package_id is being updated, fetch the new package's phase
  if (formData.package_id !== undefined) {
    const { data: packageData } = await supabase
      .from("package")
      .select("phase")
      .eq("id", formData.package_id)
      .single();
    
    if (packageData) {
      formData.phase = packageData.phase;
    }
  }
  
  const { data, error } = await supabase
    .from("trading_accounts")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function deleteTradingAccount(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("trading_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/dashboard/trading-accounts");
  return true;
}

/**
 * Sync all trading accounts' phases with their associated packages
 * Useful for manual synchronization if needed
 */
export async function syncAllTradingAccountPhases() {
  const supabase = await createClient();
  
  // Get all trading accounts with package_id
  const { data: tradingAccounts, error: fetchError } = await supabase
    .from("trading_accounts")
    .select("id, package_id, phase, package(phase)")
    .not("package_id", "is", null);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Update each trading account where phase doesn't match
  const updates = tradingAccounts
    ?.filter((ta: any) => ta.package?.phase && ta.phase !== ta.package.phase)
    .map((ta: any) => 
      supabase
        .from("trading_accounts")
        .update({ phase: ta.package.phase })
        .eq("id", ta.id)
    ) || [];

  if (updates.length > 0) {
    await Promise.all(updates);
    revalidatePath("/dashboard/trading-accounts");
  }

  return { synced: updates.length };
}
