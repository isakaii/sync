import { createClient } from "@/utils/supabase/server"
import FitnessPlan from "@/components/fitness-plan"
import Link from "next/link"

export default async function HealthPage() {
  const supabase = createClient()
  const { data: healthData, error } = await (await supabase)
    .from("health_data")
    .select("*")
    .order("date", { ascending: true }) // Fetch all data in chronological order

  if (error) {
    console.error("Error fetching health data:", error)
    return <p>Error loading health data.</p>
  }

  return (
    <div className="container mx-auto p-4">
      <FitnessPlan healthData={healthData || []} />

      {/* Navigation Button */}
      <div className="flex justify-end mt-6">
        <Link href="/ai-assistant">
          <button className="bg-blue-500 text-white px-6 py-3 rounded shadow-lg hover:bg-blue-600">
            Meet your Workout Buddy →
          </button>
        </Link>
      </div>
    </div>
  )
}
