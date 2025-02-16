import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { textToSpeak } = await request.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json({ error: "Missing ElevenLabs credentials" }, { status: 500 });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({ text: textToSpeak }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBytes = Buffer.from(arrayBuffer);
    const base64Audio = audioBytes.toString("base64");

    return NextResponse.json({ audioContent: base64Audio });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
