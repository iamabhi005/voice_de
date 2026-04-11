import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const singer = formData.get('singer');

        if (!file || !singer) {
            return NextResponse.json({ error: 'Missing file or singer' }, { status: 400 });
        }

        // 1. Simulate "AI Processing" delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 2. Strict Simulation Logic
        // We use a deterministic approach based on the singer name and file size
        // to make the "verification" feel consistent for the same recording.
        const fileSize = file.size;
        const singerSeed = singer.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Pseudo-random confidence between 0.65 and 0.95
        const baseConfidence = 0.65 + (((fileSize + singerSeed) % 30) / 100);

        // Strict threshold: 0.82 (82%)
        // Some singers will match more easily if the "seed" is right, 
        // simulating a "trained model" for that singer.
        const isMatch = baseConfidence > 0.82;
        const confidence = isMatch ? baseConfidence : baseConfidence - 0.2; // Lower confidence for non-matches

        console.log(`[Verify API] Singer: ${singer}, Size: ${fileSize}, Result: ${isMatch}, Confidence: ${confidence}`);

        return NextResponse.json({
            is_match: isMatch,
            confidence: Math.min(confidence, 0.98),
            singer: singer,
            message: isMatch
                ? `Singer ${singer} matched successfully!`
                : `Voice did not match ${singer}. Accuracy too low.`,
            is_simulation: true
        });

    } catch (error) {
        console.error('Verification API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
