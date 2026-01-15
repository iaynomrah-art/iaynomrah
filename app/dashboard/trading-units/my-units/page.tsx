import React from 'react'
import { getUnits } from '@/helper/units'

const page = async () => {
    const units = await getUnits();
    return (
        <pre>{JSON.stringify(units, null, 2)}</pre>
    )
}

export default page