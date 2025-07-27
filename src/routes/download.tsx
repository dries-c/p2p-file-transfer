import {useEffect, useMemo, useState} from 'react'
import {ReceiverPeer} from '../common/io/peer/ReceiverPeer.ts'
import {getRelayPeerAddress} from '../common/io/peer/Peer.ts'
import DownloadHandler from '../components/DownloadHandler.tsx'

export default function DownloadPage() {
  const peerId = useMemo(() => new URLSearchParams(window.location.search).get('peerId'), [])
  const [receiverPeer, setReceiverPeer] = useState<ReceiverPeer | null>(null)

  useEffect(() => {
    if (peerId) {
      ReceiverPeer.setupReceiver(getRelayPeerAddress(peerId)).then(setReceiverPeer)
    }
  }, [peerId])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <DownloadHandler receiverPeer={receiverPeer} />
        </div>
      </div>
    </div>
  )
}
