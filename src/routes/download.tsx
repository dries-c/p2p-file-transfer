import {useEffect, useState} from 'react'
import {receiveFile} from '../common/p2p'
import {multiaddr} from '@multiformats/multiaddr'
import { saveFile } from "../common/file.ts";

export default function DownloadPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFile() {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams(window.location.search)

      await receiveFile(multiaddr(searchParams.get('addr') as string), (file: File) => {
        saveFile(file)
      })
    }

    fetchFile()
  }, [])

  if (loading) return <div className="p-8 text-center">Loading file...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
}
