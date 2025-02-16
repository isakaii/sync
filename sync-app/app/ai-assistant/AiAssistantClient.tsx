"use client";

import React, { useState, useEffect } from "react";

interface AiAssistantClientProps {
  workoutInstructions: string[];
}

export default function AiAssistantClient({ workoutInstructions }: AiAssistantClientProps) {
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  async function handleSpeak() {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsSpeaking(true);
    setError(null);
    setProgress(0);

    try {
      const res = await fetch("/api/elevenlabs-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textToSpeak: workoutInstructions[currentInstructionIndex] }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Error fetching TTS audio");
      }

      const data = await res.json();
      const base64Audio = data.audioContent;
      const audioSrc = `data:audio/mpeg;base64,${base64Audio}`;

      const newAudio = new Audio(audioSrc);
      setAudio(newAudio);

      newAudio.play();
      const duration = newAudio.duration || 10;
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 100));
      }, duration * 100);

      newAudio.onended = () => {
        clearInterval(interval);
        setIsSpeaking(false);
        setProgress(100);
      };
    } catch (err: any) {
      console.error("Error calling TTS route:", err);
      setError(err.message);
      setIsSpeaking(false);
    }
  }

  function stopSpeaking() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
    setProgress(0);
  }

  function handleNextInstruction() {
    if (currentInstructionIndex < workoutInstructions.length - 1) {
      setCurrentInstructionIndex(currentInstructionIndex + 1);
      stopSpeaking();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-10">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">Your AI Fitness Guide</h1>
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-3xl w-full">
        <div className="text-blue-500 text-5xl mb-6">🔊</div>

        {workoutInstructions.length > 0 ? (
          <p className="text-xl font-semibold text-blue-700 whitespace-pre-line">
            {workoutInstructions[currentInstructionIndex]}
          </p>
        ) : (
          <p className="text-xl font-semibold text-gray-500">Loading workout plan...</p>
        )}

        <button
          onClick={handleSpeak}
          className={`mt-6 px-8 py-4 text-lg font-medium rounded-lg w-full transition ${
            isSpeaking ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {isSpeaking ? "Stop Chatting" : "Start Chatting"}
        </button>

        {/* Progress Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 mt-6">
          <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Next Instruction Button */}
        <button
          onClick={handleNextInstruction}
          className="mt-6 px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition"
          disabled={currentInstructionIndex >= workoutInstructions.length - 1}
        >
          Next Instruction
        </button>

        <div className="mt-6 text-sm text-gray-600">🎤 Listening for your feedback...</div>
      </div>
    </div>
  );
}
