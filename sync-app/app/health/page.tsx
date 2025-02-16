import { createClient } from "@/utils/supabase/server"
import FitnessPlan from "@/components/fitness-plan"

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

  return <FitnessPlan healthData={healthData || []} />
}
