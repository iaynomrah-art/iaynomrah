"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTradePair(data: {
    account_1_id: number;
    account_1_purchase_type: string;
    account_1_order_amount: number;
    account_1_tp_ticks: number;
    account_1_sl_ticks: number;
    account_1_start_equity: number;
    account_2_id: number;
    account_2_purchase_type: string;
    account_2_order_amount: number;
    account_2_tp_ticks: number;
    account_2_sl_ticks: number;
    account_2_start_equity: number;
}) {
    const supabase = await createClient();

    // 1. Insert the pair session
    const { data: pair, error: pairError } = await supabase
        .from("trade_pairs")
        .insert([data])
        .select()
        .single();

    if (pairError) {
        console.error("Error creating trade pair:", pairError);
        throw new Error(pairError.message);
    }

    // 2. Update account statuses to 'paired'
    const { error: updateError } = await supabase
        .from("trading_accounts")
        .update({ account_status: "paired" })
        .in("id", [data.account_1_id, data.account_2_id]);

    if (updateError) {
        console.error("Error updating account statuses:", updateError);
        // We don't throw here to avoid failing the whole process if just status update fails
    }

    revalidatePath("/dashboard/trade/make-money");
    return pair;
}

export async function getActiveTradePairs() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("trade_pairs")
        .select(`
            *,
            account_1:trading_accounts!trade_pairs_account_1_id_fkey(
                *,
                funders(*),
                package(*),
                units(*)
            ),
            account_2:trading_accounts!trade_pairs_account_2_id_fkey(
                *,
                funders(*),
                package(*),
                units(*)
            )
        `)
        .eq("status", "Active")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching trade pairs:", error);
        return [];
    }

    return data;
}
