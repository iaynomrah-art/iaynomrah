import { NextResponse } from 'next/server';

// Proxies the orchestrator's past-data (replay) results for the Prediction Monitor
export async function GET(request: Request) {
    const run = new URL(request.url).searchParams.get('run');
    try {
        const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL?.replace(/\/$/, '') || 'https://orchestrator.iaynomrah.cloud';
        const res = await fetch(`${orchestratorUrl}/api/v1/market/replay${run ? `?run=${encodeURIComponent(run)}` : ''}`, { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
