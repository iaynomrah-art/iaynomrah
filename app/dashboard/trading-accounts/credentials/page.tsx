import React, { Suspense } from 'react'
import { getCredentials } from '@/helper/credentials'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { CredentialsTable, CredentialsTableSkeleton } from '@/components/tables/credentials'

const CredentialsList = async () => {
    const credentials = await getCredentials();
    // Transform data if necessary or pass directly if types match
    return (
        <div className="px-6 pb-6">
            <CredentialsTable data={credentials} />
        </div>
    );
};

const page = () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505]">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Credentials"
                        addButtonText="Add Credential"
                    />
                </div>

                {/* Content Section */}
                <Suspense fallback={
                    <div className="px-6 pb-6">
                        <CredentialsTableSkeleton />
                    </div>
                }>
                    <CredentialsList />
                </Suspense>
            </div>
        </div>
    )
}

export default page