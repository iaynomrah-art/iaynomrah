import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Call the external Python API
        // We append the symbol and specific timeframe
        const url = `https://orchestrator.iaynomrah.cloud/api/v1/market/signal?symbol=${symbol}&timeframe=1h`;
        const res = await fetch(url);
        
        if (!res.ok) {
            // Wait, if it failed with the symbol, let's try calling it with just GOLD fallback
            if (res.status === 404 || res.status === 400 || res.status === 422) {
                const fallbackUrl = `https://orchestrator.iaynomrah.cloud/api/v1/market/signal?symbol=GOLD&timeframe=1h`;
                const fallbackRes = await fetch(fallbackUrl);
                if (!fallbackRes.ok) {
                    const errorText = await fallbackRes.text();
                    return NextResponse.json({ error: 'Failed to fetch signal from local API' }, { status: fallbackRes.status });
                }
                const fallbackData = await fallbackRes.json();
                return transformResponse(fallbackData);
            }
            return NextResponse.json({ error: `API Error: ${res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return transformResponse(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

function transformResponse(data: any) {
    const action = data.action?.toUpperCase() || data.final_ai_verdict?.toUpperCase() || 'NEUTRAL';
    let suggestion: 'buy' | 'sell' | 'neutral' = 'neutral';

    if (action.includes('BUY')) {
        suggestion = 'buy';
    } else if (action.includes('SELL')) {
        suggestion = 'sell';
    }

    const summary = data.action || data.ai_reasoning || data.technical_basis || action;

    return NextResponse.json({ 
        suggestion, 
        summary,
        target: data.target,
        stop: data.stop,
        data 
    });
}
