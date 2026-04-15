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
    console.error("Error fetching funder accounts:", error);
    return [];
  }
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
  const { data: funderAccountData, error: funderAccountError } = await supabase
    .from("funder_account")
    .insert([formData])
    .select()
    .single();

  if (funderAccountError) {
    throw new Error(funderAccountError.message);
  }

  // Fetch package details to populate trading account and auto-link credential
  if (formData.package_id) {
    const { data: packageData, error: packageError } = await supabase
      .from("package")
      .select("*, funders(*), credential:credentials(id, platform, username)")
      .eq("id", formData.package_id)
      .single();

    if (!packageError && packageData) {
      // Create associated trading account
      const { error: tradingAccountError } = await supabase
        .from("trading_accounts")
        .insert([
          {
            funder_account_id: funderAccountData.id,
            package: packageData.name,
            funder: packageData.funders?.name || packageData.funders?.allias,
            account_status: "idle",
            live_equity: packageData.balance || 0,
            challenge_type: packageData.phase,
          },
        ]);

      if (tradingAccountError) {
        console.error(
          "Error creating associated trading account:",
          tradingAccountError,
        );
      }

      // Auto-link the credential from the package back to the funder_account record
      // so trade automation always has a direct reference without extra joins
      if (packageData.credential_id) {
        await supabase
          .from("funder_account")
          .update({ credential_id: packageData.credential_id })
          .eq("id", funderAccountData.id);
      }
    }
  }

  revalidatePath("/dashboard/trading-accounts/funder-accounts");
  return funderAccountData;
}

export async function updateFunderAccount(id: string, formData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funder_account")
    .update(formData)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
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
        funders(name),
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
