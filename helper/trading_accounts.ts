"use server"

import { createClient } from "@/lib/supabase/server";

export async function getTradingAccounts(type?: string) {
  const supabase = await createClient();
  let query = supabase.from("trading_accounts").select("*, funders(*), units(*)");
  
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
