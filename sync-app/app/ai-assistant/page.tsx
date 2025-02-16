import { createClient } from "@/utils/supabase/server";
import AiAssistantClient from "./AiAssistantClient";

export default async function AiAssistantPage() {
  const supabase = await createClient();

  // Fetch latest workout plan
  const { data, error } = await supabase
    .from("gemini_output")
    .select("workout_plan")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching from Supabase:", error);
    return <div>Error loading Gemini output</div>;
  }

  // Format workout plan into steps
  const workoutPlan = data?.workout_plan?.days ?? [];
  const formattedInstructions = workoutPlan.map(
    (day: any) =>
      `🗓️ ${day.day}: ${day.focus}\n💡 ${day.notes}\n🏋️ ${day.workouts
        .map((w: any) => `${w.name} (${w.duration})`)
        .join(", ")}`
  );

  return <AiAssistantClient workoutInstructions={formattedInstructions} />;
}



