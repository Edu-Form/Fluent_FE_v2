export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "Missing 'text' in request body" }), { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
        }

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
        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg"
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
