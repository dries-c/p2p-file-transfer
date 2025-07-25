import {type JSX, useEffect, useState} from 'react'
import {SenderPeer} from '../common/io/peer/SenderPeer.ts'
import {multiaddr} from '@multiformats/multiaddr'
import {PeerState} from '../common/io/peer/Peer.ts'
import FilePicker from '../components/upload/FilePicker.tsx'
import DeviceSelector, {type Device} from '../components/upload/DeviceSelector.tsx'
import FileStreamProgress from '../components/download/FileStreamProgress.tsx'
import type {FileSendStream} from '../common/io/file/FileSendStream.ts'
import P2PLink from '../components/upload/P2PLink.tsx'

export default function UploadPage(): JSX.Element {
  const [peer, setPeer] = useState<SenderPeer | null>(null)
  const [peerState, setPeerState] = useState<PeerState>(PeerState.AWAITING_CONNECTION)
  const [selectedStreams, setSelectedStreams] = useState<FileSendStream[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  function resetUpload(): void {
    peer?.stop()

    setSelectedStreams([])
    setSelectedFiles([])
    setSelectedDevice(null)
    setPeer(null)
    setPeerState(PeerState.AWAITING_CONNECTION)
  }

  useEffect(() => {
    if (peerState === PeerState.CONNECTED && selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        peer?.sendFile(file).then(stream => {
          setSelectedStreams(prev => [...prev, stream])
        })
      }

      setSelectedFiles([])
    }
  }, [selectedFiles, peerState, peer?.sendFile])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {selectedDevice ? (
            peerState === PeerState.EXCHANGING ? (
              <div>
                <h3 className="mb-6 font-medium text-gray-900 text-xl">Uploading Files</h3>
                <div className="space-y-4">
                  {selectedStreams.map((stream, index) => (
                    <FileStreamProgress key={index} stream={stream} />
                  ))}
                </div>
              </div>
            ) : peerState === PeerState.DONE ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mb-2 font-medium text-gray-900 text-xl">Transfer Complete!</h3>
                <p className="mb-6 text-gray-600">All files have been successfully uploaded.</p>
                <button
                  onClick={resetUpload}
                  className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Send More Files
                </button>
              </div>
            ) : peerState === PeerState.AWAITING_CONNECTION && selectedFiles.length > 0 ? (
              <P2PLink connectionAddress={peer?.getConnectionAddress().toString()} />
            ) : peerState === PeerState.AWAITING_APPROVAL ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <h3 className="mb-2 font-medium text-gray-900 text-xl">
                  Waiting for the device to accept the transfer
                </h3>
                <p className="text-gray-600">Please check the receiving device to approve the file transfer.</p>
              </div>
            ) : (
              <FilePicker
                selectedDevice={selectedDevice}
                goBack={() => setSelectedDevice(null)}
                onFilesSelected={setSelectedFiles}
              />
            )
          ) : (
            <DeviceSelector
              localDevices={[]}
              onSelect={device => {
                setSelectedDevice(device)

                if (device.id === 'p2p') {
                  SenderPeer.setupSender(
                    multiaddr('/ip4/127.0.0.1/tcp/55967/ws/p2p/12D3KooWJWMgXf5ZewEAjNUzWoJjxKzL66NrzTzyGop8gYnuSGKY'),
                  ).then(sender => {
                    if (sender) {
                      //todo: error handling
                      setPeer(sender)
                      sender.addStateChangeListener(setPeerState)
                    }
                  })
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
