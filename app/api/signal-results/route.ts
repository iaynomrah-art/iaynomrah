import { NextResponse } from 'next/server';

// Proxies the orchestrator's graded-signal summary (shadow mode results)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    for (const key of ['days', 'setting', 'score', 'shadow']) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
    }

    try {
        const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL?.replace(/\/$/, '') || 'https://orchestrator.iaynomrah.cloud';
        const res = await fetch(`${orchestratorUrl}/api/v1/market/shadow-results?${params}`, { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
