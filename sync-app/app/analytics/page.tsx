"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Download } from "lucide-react"

type HealthData = {
  id: number
  date: string
  period_level: number
  readiness_score: number
  sleep_score: number
}

export default function AnalyticsPage() {
  const [combinedData, setCombinedData] = useState<HealthData[]>([])
  const [insights, setInsights] = useState("")
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // 1) Fetch from health_data
        const { data: healthData, error: healthError } = await supabase
          .from("health_data")
          .select("*")

        if (healthError) {
          console.error("Error fetching health_data:", healthError)
        }

        // 2) Fetch from new_health_data
        const { data: newHealthData, error: newHealthError } = await supabase
          .from("new_health_data")
          .select("*")

        if (newHealthError) {
          console.error("Error fetching new_health_data:", newHealthError)
        }

        // 3) Merge & sort
        const combined = [...(healthData || []), ...(newHealthData || [])]
        combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setCombinedData(combined)
      } catch (error) {
        console.error("Error fetching health data:", error)
      }
    }
    fetchData()
  }, [])

  // Mark 3rd data point => "Started using Sync"
  const syncStartIndex = 2
  const syncStartDate = combinedData[syncStartIndex]?.date

  const handleGenerateInsights = async () => {
    setLoadingInsights(true)
    setInsights("")

    try {
      console.log("[handleGenerateInsights] Sending data:", combinedData)
      const response = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: combinedData }),
      })

      if (!response.ok) {
        const errorRes = await response.json()
        console.error("Error from /api/generate-insights:", errorRes)
        setInsights(`Error generating insights: ${errorRes.error || "unknown error"}`)
      } else {
        const json = await response.json()
        console.log("[handleGenerateInsights] Received:", json)
        setInsights(json.insights || "No insights returned")
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      setInsights("Error generating insights.")
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleExportCSV = () => {
    const header = ["Date", "Period Level", "Readiness Score", "Sleep Score"]
    const rows = combinedData.map(d => [
      d.date,
      d.period_level.toString(),
      d.readiness_score.toString(),
      d.sleep_score.toString(),
    ])
    const csvContent = [header, ...rows].map(r => r.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "health_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-4 text-white">
      {/* Top Explanation */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-400 mb-4">Sync Insights</h1>
        <p className="text-lg mb-2">
          Discover how <span className="font-bold text-blue-300">Sync</span> tailors
          your workouts to your menstrual cycle, boosting your overall readiness and performance. 
        </p>
        <p className="text-lg mb-2">
          The data below shows how your readiness score has evolved 
          since you started using <strong>Sync</strong>. Keep going!
        </p>
        <div className="flex justify-center space-x-8 mt-4">
          <div className="p-2 bg-gray-900 rounded-lg">
            <p className="font-semibold">Workouts Completed</p>
            <p>21</p>
          </div>
          <div className="p-2 bg-gray-900 rounded-lg">
            <p className="font-semibold">Cycle Synced Sessions</p>
            <p>15</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-4 rounded-lg mb-6 text-black shadow-md">
        <h2 className="text-xl font-bold mb-4">Historical Trends</h2>
        {combinedData.length === 0 ? (
          <p>No data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={combinedData.map(d => ({
                ...d,
                readiness_score: Number(d.readiness_score),
                sleep_score: Number(d.sleep_score),
                period_level: Number(d.period_level),
              }))}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="readiness_score"
                stroke="#36A2EB"
                name="Readiness Score"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="sleep_score"
                stroke="#4BC0C0"
                name="Sleep Score"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="period_level"
                stroke="#FF6384"
                name="Period Level"
                strokeWidth={2}
              />

              {/* Reference line for Sync start */}
              {syncStartDate && (
                <ReferenceLine
                  x={syncStartDate}
                  stroke="gray"
                  strokeDasharray="3 3"
                  label="Started using Sync"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full font-semibold"
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
        >
          {loadingInsights ? "Generating..." : "Generate Insights"}
        </button>

        <button
          className="bg-blue-200 hover:bg-blue-300 text-black py-2 px-6 rounded-full font-semibold"
          onClick={handleExportCSV}
        >
          <Download className="inline-block mr-2" size={18} />
          Export to CSV
        </button>
      </div>

      {/* Display Insights */}
      {insights && (
        <div className="bg-gray-800 p-4 mt-6 rounded-lg">
          <h3 className="text-xl font-bold text-blue-200 mb-2">Your Synced Workout Insights</h3>
          <p className="text-white whitespace-pre-line">{insights}</p>
        </div>
      )}
    </div>
  )
}
