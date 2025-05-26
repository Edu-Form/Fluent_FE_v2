import { NextResponse } from "next/server";

// Simple in-memory cache for TTS responses
// In a production environment, consider using Redis or another persistent cache
const ttsCache = new Map<string, ArrayBuffer>();

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Missing 'text' in request body" }), { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
        }

        // Check if the text is already in the cache
        if (ttsCache.has(text)) {
            console.log(`Using cached TTS for: "${text.substring(0, 20)}..."`);
            const cachedAudio = ttsCache.get(text);
            return new Response(cachedAudio, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "public, max-age=86400" // Cache for 24 hours on the client
                }
            });
        }

        console.log(`Generating new TTS for: "${text.substring(0, 20)}..."`);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: "alloy"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return new Response(JSON.stringify({ error: errorData }), { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Store in cache for future requests
        ttsCache.set(text, audioBuffer);
        
        // Limit cache size to prevent memory issues (keep most recent 100 items)
        if (ttsCache.size > 100) {
            const firstKey = ttsCache.keys().next().value;
            ttsCache.delete(firstKey);
        }

        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=86400" // Cache for 24 hours on the client
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
