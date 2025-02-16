import { createClient } from "@/utils/supabase/server"
import AiAssistantClient from "./AiAssistantClient"
import Link from "next/link"

export default async function AiAssistantPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("gemini_output")
    .select("workout_plan")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching from Supabase:", error)
    return <div>Error loading Gemini output</div>
  }

  const workoutPlan = data?.workout_plan?.days ?? []
  const formattedInstructions = workoutPlan.map(
    (day: any) =>
      `🗓️ ${day.day}: ${day.focus}\n💡 ${day.notes}\n🏋️ ${day.workouts
        .map((w: any) => `${w.name} (${w.duration})`)
        .join(", ")}`
  )

  return (
    <div className="container mx-auto p-4">
      <AiAssistantClient workoutInstructions={formattedInstructions} />

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Link href="/health">
          <button className="bg-gray-500 text-white px-6 py-3 rounded shadow-lg hover:bg-gray-600">
            ← Back
          </button>
        </Link>

        <Link href="/analytics">
          <button className="bg-blue-500 text-white px-6 py-3 rounded shadow-lg hover:bg-blue-600">
            See your insights →
          </button>
        </Link>
      </div>
    </div>
  )
}