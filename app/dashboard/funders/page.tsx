import { getFunders } from '@/helper/funders'
import React from 'react'

const page = async () => {
    const funders = await getFunders();

    return (
        <pre>{JSON.stringify(funders, null, 2)}</pre>
    )
}

export default page