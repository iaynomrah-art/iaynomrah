import React from 'react'
import { getCredentials } from '@/helper/credentials'

const page = async () => {
    const credentials = await getCredentials();
    return (
        <pre>{JSON.stringify(credentials, null, 2)}</pre>
    )
}

export default page