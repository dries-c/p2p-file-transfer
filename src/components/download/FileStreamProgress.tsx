import {type JSX, useEffect, useState} from 'react'
import {type FileStream, FileStreamState} from '../../common/io/file/FileStream.ts'

export interface FileStreamProgressProps {
  stream: FileStream
}

interface Stats {
  percentComplete?: string
  rateMbps?: string
  estimatedTimeRemaining?: string
}

export default function FileStreamProgress({stream}: FileStreamProgressProps): JSX.Element {
  const [stats, setStats] = useState<Stats>({
    percentComplete: '0.0',
    rateMbps: '0.0 Mbps',
    estimatedTimeRemaining: '',
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const streamStats = stream.getStats()!

      setStats({
        percentComplete: streamStats.getPercentComplete().toFixed(1),
        rateMbps: formatTransferRate(streamStats.getRateMbps()),
        estimatedTimeRemaining: formatTimeRemaining(streamStats.getEstimatedTimeRemaining()),
      })
    }, 1000)

    if (stream.getState() === FileStreamState.DONE) {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [stream, formatTimeRemaining, formatTransferRate])

  function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return ''

    if (seconds < 60) {
      return `${Math.round(seconds)}s remaining`
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m remaining`
    } else {
      return `${Math.round(seconds / 3600)}h remaining`
    }
  }

  function formatTransferRate(mbps: number): string {
    if (mbps >= 1) {
      return `${mbps.toFixed(1)} Mbps`
    } else {
      const kbps = mbps * 1024
      return `${Math.round(kbps)} Kbps`
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-gray-900">{stream.getFileInfo()?.name}</span>
        <span className="text-gray-500 text-sm">{stats?.percentComplete}%</span>
      </div>

      <div className="mb-3 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-green-500 transition-all duration-300"
          style={{width: `${stats?.percentComplete}%`}}
        ></div>
      </div>

      <div className="flex items-center justify-between text-gray-500 text-sm">
        <span>{stats?.rateMbps}</span>
        <span>{stats?.estimatedTimeRemaining}</span>
      </div>
    </div>
  )
}
