"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Backfill trading_accounts for any funder_account records that were inserted
 * directly into the DB (bypassing the UI's createFunderAccount helper).
 */
async function syncMissingTradingAccounts() {
  const supabase = await createClient();

  // Find funder_accounts that have no corresponding trading_accounts row
  const { data: allFunderAccounts, error: faError } = await supabase
    .from("funder_account")
    .select("id, package_id, package:package(balance)");

  if (faError || !allFunderAccounts) {
    console.error("[syncMissing] Error fetching funder_accounts:", faError?.message, faError?.details);
    return;
  }

  const { data: existingTAs, error: taError } = await supabase
    .from("trading_accounts")
    .select("funder_account_id");

  if (taError) {
    console.error("[syncMissing] Error fetching trading_accounts:", taError.message);
    return;
  }

  const linkedIds = new Set((existingTAs || []).map((ta: any) => ta.funder_account_id));
  const missing = allFunderAccounts.filter((fa: any) => !linkedIds.has(fa.id));

  if (missing.length === 0) return;

  console.log(`[syncMissing] Found ${missing.length} funder_accounts without trading_accounts, backfilling...`);

  // Insert with FK + live_equity from package balance
  for (const fa of missing) {
    const balance = (fa as any).package?.balance || 0;
    const { error: insertError } = await supabase
      .from("trading_accounts")
      .insert([{ funder_account_id: fa.id, account_status: "idle", live_equity: balance }]);

    if (insertError) {
      console.error(`[syncMissing] Error backfilling for ${fa.id}:`, insertError.message, insertError.details, insertError.hint);
      // Try absolute minimum
      const { error: retryError } = await supabase
        .from("trading_accounts")
        .insert([{ funder_account_id: fa.id }]);
      if (retryError) {
        console.error(`[syncMissing] RETRY FAILED for ${fa.id}:`, retryError.message, retryError.details, retryError.hint);
      } else {
        console.log(`[syncMissing] Backfilled (minimal) for ${fa.id}`);
      }
    } else {
      console.log(`[syncMissing] Backfilled for ${fa.id} with live_equity: ${balance}`);
    }
  }
}

export async function getTradingAccounts(type?: string) {
  const supabase = await createClient();

  // Backfill any funder_accounts missing from trading_accounts
  await syncMissingTradingAccounts();

  // Repair: fix any trading_accounts with 0/null live_equity from package balance
  const { data: zeroEquity } = await supabase
    .from("trading_accounts")
    .select("id, funder_account_id")
    .or("live_equity.eq.0,live_equity.is.null");

  if (zeroEquity && zeroEquity.length > 0) {
    for (const ta of zeroEquity) {
      if (!ta.funder_account_id) continue;
      const { data: fa } = await supabase
        .from("funder_account")
        .select("package:package(balance)")
        .eq("id", ta.funder_account_id)
        .single();
      const balance = (fa as any)?.package?.balance;
      if (balance && balance > 0) {
        await supabase
          .from("trading_accounts")
          .update({ live_equity: balance })
          .eq("id", ta.id);
        console.log(`[repairEquity] Updated trading_account ${ta.id} live_equity to ${balance}`);
      }
    }
  }

  let query = supabase.from("trading_accounts").select(`
    *,
    funder_account:funder_account_id(
      *,
      package_data:package(
        *, 
        funders(*), 
        account:accounts(*, units(*)), 
        credential:credentials(*)
      )
    )
  `);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trading accounts:", error.message, error.details, error.hint);
    return [];
  }
  console.log(`[getTradingAccounts] Returned ${data?.length ?? 0} records`);

  // Flatten the data to maintain compatibility with existing components
  const flattened = data.map((item: any) => {
    const pkg = item.funder_account?.package_data;
    const funderAccountId = item.funder_account?.id || item.funder_account_id;
    return {
      ...(item.funder_account || {}),
      ...item,
      funder_account_id: funderAccountId,
      status: item.account_status || item.funder_account?.status || "idle",
      id: item.id,
      package_ref: pkg,
      accounts: pkg?.account,
      credentials: pkg?.credential,
      accounts_id: pkg?.credential?.platform_id,
    };
  });

  return flattened;
}

export async function getTradingAccountById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trading_accounts")
    .select(
      `
      *,
      funder_account:funder_account_id(
        *,
        package_data:package(
          *, 
          funders(*), 
          account:accounts(*, units(*)), 
          credential:credentials(*)
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching trading account:", error);
    return null;
  }

  // Flatten the data
  const item = data as any;
  const pkg = item.funder_account?.package_data;
  return {
    ...(item.funder_account || {}),
    ...item,
    status: item.account_status || item.funder_account?.status || "idle",
    id: item.id,
    package_ref: pkg,
    accounts: pkg?.account,
    credentials: pkg?.credential,
    accounts_id: pkg?.credential?.platform_id,
  };
}

export async function createTradingAccount(formData: any) {
  const supabase = await createClient();

  // If package_id is provided, fetch the package name/details if needed to populate the 'package' text column
  if (formData.package_id && !formData.package) {
    const { data: packageData } = await supabase
      .from("package")
      .select("name")
      .eq("id", formData.package_id)
      .single();

    if (packageData) {
      formData.package = packageData.name;
    }
  }

  const { data, error } = await supabase
    .from("funder_account")
    .insert([formData])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function updateTradingAccount(id: string, formData: any) {
  const supabase = await createClient();

  // If package_id is being updated, fetch the new package's name
  if (formData.package_id !== undefined && !formData.package) {
    const { data: packageData } = await supabase
      .from("package")
      .select("name")
      .eq("id", formData.package_id)
      .single();

    if (packageData) {
      formData.package = packageData.name;
    }
  }

  const { data, error } = await supabase
    .from("funder_account")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return data;
}

export async function deleteTradingAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("funder_account").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/trading-accounts");
  return true;
}

/**
 * Sync all funder accounts' packages with their associated packages
 */
export async function syncAllTradingAccountPhases() {
  const supabase = await createClient();

  // Get all accounts with package_id
  const { data: tradingAccounts, error: fetchError } = await supabase
    .from("funder_account")
    .select(
      "id, package_id, package, package_ref:package!funder_account_package_id_fkey(name)",
    )
    .not("package_id", "is", null);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Update each account where package name doesn't match
  const updates =
    tradingAccounts
      ?.filter(
        (ta: any) => ta.package_ref?.name && ta.package !== ta.package_ref.name,
      )
      .map((ta: any) =>
        supabase
          .from("funder_account")
          .update({ package: ta.package_ref.name })
          .eq("id", ta.id),
      ) || [];

  if (updates.length > 0) {
    await Promise.all(updates);
    revalidatePath("/dashboard/trading-accounts");
  }

  return { synced: updates.length };
}

export async function checkAndMarkBurned(
  funderAccountId: string,
  payload: {
    liveEquity: number;
    dailyStartingEquity: number;
    maxDailyLoss: number;
    maxTotalLoss: number;
    balance: number;
  }
): Promise<"daily_drawdown" | "total_drawdown" | null> {
  const { liveEquity, dailyStartingEquity, maxDailyLoss, maxTotalLoss, balance } = payload;

  const isDailyBurned = maxDailyLoss > 0 && (dailyStartingEquity - liveEquity) >= maxDailyLoss;
  const isTotalBurned = maxTotalLoss > 0 && (balance - liveEquity) >= maxTotalLoss;

  if (!isDailyBurned && !isTotalBurned) return null;

  const burnReason = isDailyBurned ? "daily_drawdown" : "total_drawdown";
  const supabase = await createClient();

  await supabase
    .from("funder_account")
    .update({ status: "burned", burn_reason: burnReason })
    .eq("id", funderAccountId);

  revalidatePath("/", "layout");
  return burnReason;
}
