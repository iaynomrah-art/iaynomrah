import { NextResponse } from 'next/server';

// Proxies orchestrator's market timing statistics (measured from broker 5-minute candles)
export async function GET() {
    try {
        const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL?.replace(/\/$/, '') || 'https://orchestrator.iaynomrah.cloud';
        const res = await fetch(`${orchestratorUrl}/api/v1/market/timing`, { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
