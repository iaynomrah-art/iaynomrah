import React from 'react'
import { getPackages } from '@/helper/package'

const page = async () => {
    const packages = await getPackages();
    return (
        <pre>{JSON.stringify(packages, null, 2)}</pre>
    )
}

export default page