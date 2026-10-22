import { NextResponse } from 'next/server';

// Proxies the orchestrator's live status for the Prediction Monitor page
export async function GET() {
    try {
        const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL?.replace(/\/$/, '') || 'https://orchestrator.iaynomrah.cloud';
        const res = await fetch(`${orchestratorUrl}/api/v1/market/shadow-status`, { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
