"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts"

type HealthData = {
  id: number
  date: string
  period_level: number
  readiness_score: number
  sleep_score: number
}

export default function FitnessPlan() {
  const [combinedData, setCombinedData] = useState<HealthData[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Initialize Supabase
        const supabase = createClient()

        // Query for data from both "new_health_data" and "health_data" tables
        const { data: newHealthData, error: newHealthError } = await supabase
          .from("new_health_data")
          .select("id, date, period_level, readiness_score, sleep_score")
        
        const { data: healthData, error: healthError } = await supabase
          .from("health_data")
          .select("id, date, period_level, readiness_score, sleep_score")
        
        if (newHealthError || healthError) {
          throw new Error(newHealthError?.message || healthError?.message)
        }

        // Combine both datasets
        const combined = [...(newHealthData || []), ...(healthData || [])]
        
        // Sort by date (earliest first)
        combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Set the combined data to state
        setCombinedData(combined)

      } catch (error) {
        console.error("Error fetching health data:", error)
      }
    }

    fetchData()
  }, [])

  // Calculate the middle point based on the first and last date of the combined data
  const midpointIndex = Math.floor(combinedData.length / 2)
  const midpointDate = combinedData.length > 0 ? combinedData[midpointIndex].date : ""

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

      {/* Graphical Display of Historical Data */}
      <Card className="mb-6 p-4 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <Calendar className="mr-2" /> Historical Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {combinedData.length === 0 ? (
            <p className="text-gray-600">No historical data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={combinedData.map((d) => ({
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

                {/* Add the vertical reference line in the middle */}
                {midpointDate && (
                  <ReferenceLine x={midpointDate} stroke="gray" strokeDasharray="3 3" label="After starting Sync" />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
