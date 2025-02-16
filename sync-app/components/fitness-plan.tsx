"use client"

import { useState, useEffect } from "react"
import axios from "axios"
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
  readiness_sc: number
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

  useEffect(() => {
    if (healthData.length > 0) {
      generateWorkoutPlan(healthData)
    }
  }, [healthData])

  async function generateWorkoutPlan(data: HealthData[]) {
    setLoading(true)
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: `You are a fitness AI assistant specializing in cycle-synced workout plans. Your goal is to analyze past cycle and readiness data and generate an optimal **7-day workout plan**.
  
                **Historical Data (Latest First):**
                ${JSON.stringify(data, null, 2)}
  
                **Instructions:**
                - Cite specific **period levels**, **readiness scores**, and **symptoms** from the data in your reasoning.
                - Support workout recommendations with **scientific studies or sports medicine guidelines**.
                - Format the response as **valid JSON**:
  
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
                      "notes": "Since the user's period level on ${data[0]?.date} was ${data[0]?.period_level}, they may experience fatigue. A study by Smith et al. (2021) found that **low-impact strength training can mitigate PMS-related fatigue and inflammation.**"
                    },
                    {
                      "day": "Tuesday",
                      "focus": "Cardio & Endurance",
                      "workouts": [
                        {"name": "Running", "duration": "30 min"},
                        {"name": "Jump Rope", "duration": "10 min"}
                      ],
                      "notes": "Due to a readiness score of ${data[0]?.readiness_sc} on ${data[0]?.date}, aerobic training is ideal today. A study in the Journal of Sports Science (2020) suggests that **moderate-intensity cardio improves recovery during mid-cycle phases.**"
                    }
                  ]
                }
  
                **Make sure the output is a valid JSON response with no extra text or Markdown formatting.**`
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
  
      setWorkoutPlan(structuredPlan?.days || [])
    } catch (error) {
      console.error("Error fetching workout plan from Gemini:", error)
      setWorkoutPlan([])
    }
    setLoading(false)
  }
  
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Cycle-Synced Fitness Plan</h1>

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
              <p>Readiness Score: {entry.readiness_sc}</p>
              <p>Sleep Score: {entry.sleep_score}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphical Display of Historical Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" /> Historical Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={healthData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <CartesianGrid strokeDasharray="3 3" />
              <Line type="monotone" dataKey="period_level" stroke="#FF6384" name="Period Level" />
              <Line type="monotone" dataKey="readiness_sc" stroke="#36A2EB" name="Readiness Score" />
              <Line type="monotone" dataKey="sleep_score" stroke="#4BC0C0" name="Sleep Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI-Generated Workout Plan */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Activity className="mr-2" /> AI-Generated 7-Day Workout Plan
          </CardTitle>
          <button
            onClick={() => generateWorkoutPlan(healthData)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workoutPlan.map((dayPlan) => (
                <Card key={dayPlan.day}>
                  <CardHeader>
                    <CardTitle className="text-lg">{dayPlan.day}: {dayPlan.focus}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc ml-4">
                      {dayPlan.workouts.map((workout, index) => (
                        <li key={index}>{workout.name} - {workout.duration}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-gray-600">{dayPlan.notes}</p>
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
