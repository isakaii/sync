"use client"

import { useState } from "react"
import axios from "axios"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Calendar, Moon, User, RefreshCcw } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

type HealthData = {
  id: number
  date: string
  weight: number
  condition: string
  athlete_type: string
  period_level: number
  symptoms: string
  readiness_score: number
  sleep_score: number
}

type WorkoutPlan = {
  day: string
  focus: string
  workouts: { name: string; duration: string }[]
  notes: string
}

export default function FitnessPlan({ healthData }: { healthData: HealthData[] }) {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(false)

  async function generateWorkoutPlan() {
    setLoading(true)
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: `You are a fitness AI assistant specializing in cycle-synced workout plans. Analyze the user's past **period levels, symptoms, readiness scores, and sleep scores** to generate an optimal **7-day workout plan**. Make sure to generate 7 full days.

                **Historical Data (Latest First):**
                ${JSON.stringify(healthData, null, 2)}

                **Instructions:**
                - Cite specific **period levels**, **readiness scores**, and **symptoms** from the data.
                - Support recommendations with **scientific research** or sports medicine guidelines.
                - Format the response in **valid JSON** as follows:

                {
                  "days": [
                    {
                      "day": "Monday",
                      "focus": "Strength Training",
                      "workouts": [
                        {"name": "Squats", "duration": "10 min"},
                        {"name": "Lunges", "duration": "10 min"},
                        {"name": "Core Workout", "duration": "10 min"}
                      ],
                      "notes": "Since the user's period level on ${healthData[0]?.date} was ${healthData[0]?.period_level}, they may experience fatigue. A study by Smith et al. (2021) found that **low-impact strength training can mitigate PMS-related fatigue and inflammation.**"
                    },
                    {
                      "day": "Tuesday",
                      "focus": "Cardio & Endurance",
                      "workouts": [
                        {"name": "Running", "duration": "30 min"},
                        {"name": "Jump Rope", "duration": "10 min"}
                      ],
                      "notes": "Due to a readiness score of ${healthData[0]?.readiness_score} on ${healthData[0]?.date}, aerobic training is ideal today. A study in the Journal of Sports Science (2020) suggests that **moderate-intensity cardio improves recovery during mid-cycle phases.**"
                    }
                  ]
                }

                **Ensure the output is valid JSON and contains no extra text or Markdown formatting.**`
                }
              ]
            }
          ]
        },
        {
          params: { key: process.env.NEXT_PUBLIC_GEMINI_API_KEY },
          headers: { "Content-Type": "application/json" }
        }
      )

      let rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
      rawText = rawText.replace(/```json|```/g, "").trim()
      const structuredPlan = JSON.parse(rawText)

      // Save generated workout plan in state
      setWorkoutPlan(structuredPlan?.days || [])

      // 🛠️ Initialize Supabase inside function
      const supabase = createClient()

      // Write output to Supabase
      const { error } = await (await supabase).from("gemini_output").insert([
        {
          generated_at: new Date().toISOString(),
          workout_plan: structuredPlan
        }
      ])
      if (error) throw error
    } catch (error) {
      console.error("Error fetching workout plan from Gemini or writing to Supabase:", error)
      setWorkoutPlan([])
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4">

      {/* App Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">Sync</h1>
        <p className="text-lg text-gray-700 mt-2">
          Effective workout plans, <span className="text-blue-500">synced to your cycles</span> for maximum impact.
          Work your body optimally with <span className="font-bold text-blue-600">Sync</span>.
        </p>
      </div>

      {/* Show all historical health data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {healthData.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" /> {entry.date}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Weight: {entry.weight} lbs</p>
              <p>Condition: {entry.condition}</p>
              <p>Athlete Type: {entry.athlete_type}</p>
              <p>Period Level: {entry.period_level}</p>
              <p>Symptoms: {entry.symptoms}</p>
              <p>Readiness Score: {entry.readiness_score}</p>
              <p>Sleep Score: {entry.sleep_score}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphical Display of Historical Data */}
      <Card className="mb-6 p-4 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <Calendar className="mr-2" /> Historical Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData.length === 0 ? (
            <p className="text-gray-600">No historical data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={healthData.map((d) => ({
                  ...d,
                  readiness_sc: Number(d.readiness_score) || 0, // Ensure numerical value
                  sleep_score: Number(d.sleep_score) || 0,
                  period_level: Number(d.period_level) || 0
              }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="period_level" stroke="#FF6384" name="Period Level" strokeWidth={2} />
                <Line type="monotone" dataKey="readiness_sc" stroke="#36A2EB" name="Readiness Score" strokeWidth={2} />
                <Line type="monotone" dataKey="sleep_score" stroke="#4BC0C0" name="Sleep Score" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* AI-Generated Workout Plan */}
      <Card className="mb-6"> {/* Added margin-bottom for spacing */}
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Activity className="mr-2" /> AI-Generated 7-Day Workout Plan
          </CardTitle>
          <button
            onClick={generateWorkoutPlan}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600"
          >
            <RefreshCcw className="mr-2" /> Refresh Plan
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Generating workout plan...</p>
          ) : workoutPlan.length === 0 ? (
            <p>No plan generated yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Adds spacing & responsive layout */}
              {workoutPlan.map((dayPlan, index) => (
                <Card key={index} className="mb-4 p-4 shadow-lg rounded-xl"> {/* Added padding & rounded corners */}
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{dayPlan.day}: {dayPlan.focus}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc ml-4 space-y-2"> {/* Adds bullet points & spacing */}
                      {dayPlan.workouts.map((w, i) => (
                        <li key={i} className="text-gray-700">{w.name} - {w.duration}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm text-gray-600">{dayPlan.notes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
