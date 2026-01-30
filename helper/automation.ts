
import { TradingAccount } from "../types/trading_accounts"
import axios from "axios"

export const loginToAccount = async (account: TradingAccount) => {
    const result = await axios.post(`${account.accounts?.units?.api_base_url}api/v1/runner/CtraderLogin.1.0.4.nupkg`, {     
        arguments: {
            username: String(account.credentials?.username || ""),
            password: String(account.credentials?.password || ""),
        }  
    }, {timeout: 100})

    return result.data
}

export const inputCtraderOrder = async (apiBaseUrl: string, payload: any) => {
    const result = await axios.post(`${apiBaseUrl}api/v1/runner/CtraderLogin.1.0.6.nupkg`, {     
        arguments: {
            ...payload
        }  
    })

    return result.data
}

export const confirmTrade = async (apiBaseUrl: string, payload: any) => {
    const result = await axios.post(`${apiBaseUrl}api/v1/runner/ConfirmTrade.1.0.1.nupkg`, {     
        arguments: {
            ...payload
        }  
    })

    return result.data
}
