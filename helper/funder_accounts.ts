"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFunderAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .select(
      "*, package(*, funders(*), account:accounts(*, units(*)), credential:credentials(*))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funder accounts:", error.message, error.details, error.hint);
    return [];
  }
  console.log(`[getFunderAccounts] Returned ${data?.length ?? 0} records`);
  return data;
}

export async function getFunderAccountById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .select(
      "*, package(*, funders(*), account:accounts(*, units(*)), credential:credentials(*))",
    )
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

  // Extract credential_id since it's not in the funder_account table
  const { credential_id, ...funderAccountPayload } = formData;
  let account_id = null;

  if (credential_id) {
    const { data: cred } = await supabase.from('credentials').select('account_id').eq('id', credential_id).single();
    if (cred) {
      account_id = cred.account_id;
      funderAccountPayload.user = account_id;
    }
  }

  const { data: funderAccountData, error: funderAccountError } = await supabase
    .from("funder_account")
    .insert([funderAccountPayload])
    .select()
    .single();

  if (funderAccountError) {
    console.error("Error creating funder account:", funderAccountError.message, funderAccountError.details, funderAccountError.hint);
    throw new Error(funderAccountError.message);
  }
  console.log("[createFunderAccount] Created:", funderAccountData);

  // Sync the selected credential to the package so display queries work
  // (display relies on package.credential_id and package.account_id)
  if (formData.package_id && formData.credential_id) {
    const { data: cred } = await supabase.from('credentials').select('account_id').eq('id', formData.credential_id).single();

    const { error: syncError } = await supabase
      .from("package")
      .update({
        credential_id: formData.credential_id,
        account_id: cred?.account_id || null
      })
      .eq("id", formData.package_id);
    if (syncError) {
      console.error("[createFunderAccount] Error syncing credential to package:", syncError.message);
    } else {
      console.log("[createFunderAccount] Synced credential and account to package");
    }
  }

  // Fetch package details to populate trading account and auto-link credential
  console.log("[createFunderAccount] formData.package_id:", formData.package_id);
  if (formData.package_id) {
    const { data: packageData, error: packageError } = await supabase
      .from("package")
      .select("*, funders(*), credential:credentials(id, platform, username)")
      .eq("id", formData.package_id)
      .single();

    console.log("[createFunderAccount] Package fetch result:", {
      packageData: packageData ? { id: packageData.id, name: packageData.name, funder_id: packageData.funder_id, credential_id: packageData.credential_id, funders: packageData.funders } : null,
      packageError: packageError ? { message: packageError.message, details: packageError.details, hint: packageError.hint } : null,
    });

    if (!packageError && packageData) {
      // Create associated trading account - use minimal insert first (FK only)
      // then try optional denormalized fields. The display works via FK joins anyway.
      console.log("[createFunderAccount] Creating trading account for funder_account:", funderAccountData.id);

      const { data: tradingAccountData, error: tradingAccountError } = await supabase
        .from("trading_accounts")
        .insert([{
          funder_account_id: funderAccountData.id,
          account_status: "idle",
          live_equity: packageData.balance || 0,
        }])
        .select()
        .single();

      if (tradingAccountError) {
        console.error(
          "[createFunderAccount] ERROR creating trading account:",
          tradingAccountError.message, tradingAccountError.details, tradingAccountError.hint,
        );
        // Retry with absolute minimum - just the FK
        console.log("[createFunderAccount] Retrying with minimal insert (FK only)...");
        const { data: retryData, error: retryError } = await supabase
          .from("trading_accounts")
          .insert([{ funder_account_id: funderAccountData.id }])
          .select()
          .single();

        if (retryError) {
          console.error("[createFunderAccount] RETRY ALSO FAILED:", retryError.message, retryError.details, retryError.hint);
        } else {
          console.log("[createFunderAccount] Trading account CREATED (minimal):", retryData);
          // Try to update with optional fields
          await supabase.from("trading_accounts").update({
            account_status: "idle",
            live_equity: packageData.balance || 0,
          }).eq("id", retryData.id);
        }
      } else {
        console.log("[createFunderAccount] Trading account CREATED:", tradingAccountData);
        // Try to set optional denormalized fields (may fail if columns don't exist)
        try {
          await supabase.from("trading_accounts").update({
            package: packageData.name,
            funder: packageData.funders?.name || packageData.funders?.allias,
            challenge_type: packageData.phase,
          }).eq("id", tradingAccountData.id);
        } catch (e) {
          // Optional fields - ignore if columns don't exist
        }
      }

      // Auto-link the account_id from the package back to the funder_account record
      // so trade automation always has a direct reference without extra joins
      if (packageData.account_id) {
        const { error: linkError } = await supabase
          .from("funder_account")
          .update({ user: packageData.account_id })
          .eq("id", funderAccountData.id);
        console.log("[createFunderAccount] User auto-link:", linkError ? `ERROR: ${linkError.message}` : "SUCCESS");
      } else {
        console.log("[createFunderAccount] No account_id on package, skipping auto-link");
      }
    } else {
      console.error("[createFunderAccount] Package fetch FAILED, skipping trading account creation");
    }
  } else {
    console.log("[createFunderAccount] No package_id in formData, skipping trading account creation");
  }

  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return funderAccountData;
}

export async function updateFunderAccount(id: string, formData: any) {
  const supabase = await createClient();

  const { credential_id, ...funderAccountPayload } = formData;
  let account_id = null;

  if (credential_id) {
    const { data: cred } = await supabase.from('credentials').select('account_id').eq('id', credential_id).single();
    if (cred) {
      account_id = cred.account_id;
      funderAccountPayload.user = account_id;
    }
  }

  const { data, error } = await supabase
    .from("funder_account")
    .update(funderAccountPayload)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  // Sync the selected credential to the package so display queries work
  if (formData.package_id && formData.credential_id) {
    const { data: cred } = await supabase.from('credentials').select('account_id').eq('id', formData.credential_id).single();

    await supabase
      .from("package")
      .update({
        credential_id: formData.credential_id,
        account_id: cred?.account_id || null
      })
      .eq("id", formData.package_id);
  }

  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return data;
}

export async function deleteFunderAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("funder_account").delete().eq("id", id);

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
    .select(
      `
      id,
      status,
      created_at,
      package:package(
        name, 
        credential_id,
        credential:credentials(username, platform_id),
        funders(name, allias, allias_color, text_color),
        account:accounts(id, first_name, last_name, email, units(unit_name))
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching funder accounts table data:", error);
    return [];
  }
  return data;
}
