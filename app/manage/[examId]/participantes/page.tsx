"use client"

import { useParams } from "next/navigation"
import { ParticipantesTable } from "./participantes-table"

export default function ParticipantesPage() {
  const { examId } = useParams<{ examId: string }>()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-read-white">Participantes</h1>
      <ParticipantesTable examId={examId} />
    </div>
  )
}
