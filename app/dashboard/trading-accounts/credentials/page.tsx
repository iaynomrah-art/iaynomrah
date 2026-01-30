import React, { Suspense } from 'react'
import { getCredentials } from '@/helper/credentials'
import { SearchBarHeader } from '@/components/ui/search-bar-header'
import { CredentialsTable, CredentialsTableSkeleton } from '@/components/tables/credentials'
import { CreateCredentialDialog } from '@/components/modal/Create/CreateCredentials'


const CredentialsList = async () => {
    const credentials = await getCredentials();
    return (
        <div className="px-6 pb-6">
            <CredentialsTable data={credentials} />
        </div>
    );
};

// Make the page async to fetch funders
const Page = async () => {
    return (
        <div suppressHydrationWarning className="p-6 bg-[#050505] h-full">
            <div className="flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-10">
                    <SearchBarHeader
                        title="Credentials"
                        // Instead of addHref, we use actionComponent
                        actionComponent={
                            <CreateCredentialDialog />
                        }
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

export default Page