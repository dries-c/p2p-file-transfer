import {useEffect, useMemo, useState} from 'react'
import {multiaddr} from '@multiformats/multiaddr'
import {saveFile} from '../common/file.ts'
import {ReceiverPeer} from '../common/io/peer/ReceiverPeer.ts'
import type {FileReceiveStream} from '../common/io/file/FileReceiveStream.ts'
import {PeerState} from '../common/io/peer/Peer.ts'
import StreamSelector from '../components/download/StreamSelector'
import FileStreamProgress from '../components/download/FileStreamProgress'

export default function DownloadPage() {
  const multiAddr = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.has('addr') ? multiaddr(searchParams.get('addr')) : null
  }, [])

  const [streams, setStreams] = useState<FileReceiveStream[]>([])
  const [selectedStreams, setSelectedStreams] = useState<FileReceiveStream[]>([])

  const [peerState, setPeerState] = useState<PeerState>(PeerState.CONNECTED)

  useEffect(() => {
    if (multiAddr) {
      ReceiverPeer.setupReceiver(multiAddr).then(receiverPeer => {
        receiverPeer.addFileReceiveStreamListener(stream => {
          setStreams(receiverPeer.getStreams())
          setSelectedStreams(prev => [...prev, stream])

          stream.addFileReceiveListener(saveFile)
        })

        receiverPeer.addStateChangeListener(setPeerState)
      })
    }
  }, [multiAddr])

  function startDownload() {
    for (const stream of streams) {
      if (selectedStreams.includes(stream)) {
        stream.approveFile()
      } else {
        stream.rejectFile()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {peerState === PeerState.AWAITING_CONNECTION && (
            <div className="mb-6">
              <h3 className="mb-4 font-medium text-gray-900 text-lg">Awaiting Connection</h3>
              <p className="text-gray-600">Connecting to peer...</p>
            </div>
          )}

          {peerState === PeerState.CONNECTED && (
            <div className="mb-6">
              <h3 className="mb-4 font-medium text-gray-900 text-lg">Connected to Peer</h3>
              <p className="text-gray-600">Waiting for files to be shared...</p>
            </div>
          )}

          {peerState === PeerState.AWAITING_APPROVAL && (
            <>
              <StreamSelector
                streams={streams}
                selectedStreams={selectedStreams}
                setSelectedStreams={setSelectedStreams}
              />

              {selectedStreams.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={startDownload}
                    className="rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    Download {selectedStreams.length} File{selectedStreams.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </>
          )}

          {peerState === PeerState.EXCHANGING && (
            <div>
              <h3 className="mb-6 font-medium text-gray-900 text-xl">Downloading Files</h3>
              <div className="space-y-4">
                {selectedStreams.map((stream, index) => (
                  <FileStreamProgress key={index} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {peerState === PeerState.DONE && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-xl">Download Complete!</h3>
              <p className="mb-6 text-gray-600">All selected files have been successfully downloaded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
