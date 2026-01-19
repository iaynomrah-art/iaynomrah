'use client'

import { TradingAccount } from "../types/trading_accounts"
import axios from "axios"

export const loginToAccount = async (account: TradingAccount) => {
    const result = await axios.post(`${account.units?.api_base_url}api/v1/runner/CtraderLogin.1.0.4.nupkg`, {     
        arguments: {
            username: account.credentials?.username,
            password: account.credentials?.password,
        }  
    })

    return result.data
}