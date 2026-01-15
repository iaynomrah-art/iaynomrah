import React from 'react'
import { getAccounts } from '@/helper/accounts'

const page = async () => {
    const accounts = await getAccounts();
    return (
        <pre>{JSON.stringify(accounts, null, 2)}</pre>
    )
}

export default page