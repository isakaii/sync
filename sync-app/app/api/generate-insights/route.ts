import { NextRequest, NextResponse } from "next/server"

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ""

export async function POST(request: NextRequest) {
  try {
    console.log("[POST /api/generate-insights] invoked.")

    // 1) Parse incoming data
    const { data } = await request.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "No valid data array" }, { status: 400 })
    }

    // 2) Identify the “start using Sync” date
    //    The user said the 3rd data point is where they started using Sync
    //    That’s index 2 if data[2] exists
    const syncStartIndex = 2
    const syncStartDate = data[syncStartIndex]?.date ?? "Unknown"

    // 3) Compute averages before and after Sync
    //    "Before" => data.slice(0,2)
    //    "After" => data.slice(2,...) (including index 2, or skip if you prefer)
    const dataBefore = data.slice(0, syncStartIndex)
    const dataAfter = data.slice(syncStartIndex)

    // Helper to compute average readiness
    const averageReadiness = (arr: any[]): number => {
      if (!arr.length) return 0
      const sum = arr.reduce((acc, curr) => acc + Number(curr.readiness_score), 0)
      return sum / arr.length
    }

    const avgBefore = averageReadiness(dataBefore).toFixed(1)
    const avgAfter = averageReadiness(dataAfter).toFixed(1)

    // 4) Build a robust “chat” prompt
    //    Summarize the user’s data, comparing before & after.
    const systemPrompt = "You are an AI that provides helpful, concise workout insights."
    const userPrompt = `
The user started using Sync on the third data point (around ${syncStartDate}).

Below is a summary of their data (period level, readiness, and sleep):

${data.map(d => (
  `Date: ${d.date}, Period Level: ${d.period_level}, ` +
  `Readiness: ${d.readiness_score}, Sleep: ${d.sleep_score}`
)).join("\n")}

Before Sync, the average readiness score was about ${avgBefore}.
After Sync, the average readiness score is about ${avgAfter}.

Generate insights on:
1. How their readiness and sleep scores have improved over time.
2. Why aligning workouts with menstrual cycles leads to better readiness.
3. Any noticeable trends or cyclical patterns, and what the user should do going forward.
4. How they can maintain or further improve their readiness.

Please present these insights in a clear, concise way.
    `.trim()

    // 5) Make the request to Perplexity’s “chat/completions” endpoint
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Perplexity requires “Bearer” format
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro", // or "pplx-l-chat" or whichever is valid for your plan
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    })

    // 6) Handle errors from Perplexity
    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      console.error("[Perplexity error]", errorText)
      return NextResponse.json({
        error: "Perplexity API error",
        detail: errorText,
      }, { status: 500 })
    }

    // 7) Parse success
    const perplexityData = await perplexityResponse.json()
    console.log("Perplexity response:", perplexityData)

    // Typically, Perplexity returns the text in: .choices[0].message.content
    const insights = perplexityData?.choices?.[0]?.message?.content || "No insights."

    return NextResponse.json({ insights }, { status: 200 })
  } catch (err) {
    console.error("Error in /api/generate-insights route:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
