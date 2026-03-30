import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Call the local Python API
        // If symbol is passed, we append it, though the local python app might handle it internally
        const url = `http://localhost:8000/api/signal?symbol=${symbol}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            // Wait, if it failed with the symbol, let's try calling it without the symbol as fallback
            if (res.status === 404 || res.status === 400 || res.status === 422) {
                const fallbackUrl = `http://localhost:8000/api/signal`;
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
    const verdict = data.final_ai_verdict?.toUpperCase() || 'NEUTRAL';
    let suggestion: 'buy' | 'sell' | 'neutral' = 'neutral';

    if (verdict.includes('BUY')) {
        suggestion = 'buy';
    } else if (verdict.includes('SELL')) {
        suggestion = 'sell';
    }

    const summary = data.ai_reasoning || data.technical_basis || verdict;

    return NextResponse.json({ 
        suggestion, 
        summary, 
        data 
    });
}
