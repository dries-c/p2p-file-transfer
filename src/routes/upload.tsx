import {type JSX, useEffect, useMemo, useState} from 'react'
import {TransceiverPeer} from '../common/io/peer/TransceiverPeer.ts'
import {PeerState} from '../common/io/peer/Peer.ts'
import FilePicker from '../components/upload/FilePicker.tsx'
import PeerSelector from '../components/upload/DeviceSelector.tsx'
import FileStreamProgress from '../components/download/FileStreamProgress.tsx'
import type {FileSendStream} from '../common/io/file/FileSendStream.ts'
import P2PLink from '../components/upload/P2PLink.tsx'
import type {PeerId} from '@libp2p/interface'
import type {DeviceInformation, RemotePeer} from '../common/io/peer/RemotePeer.ts'
import WaitingScreen from '../components/WaitingScreen.tsx'
import SuccessScreen from '../components/SuccessScreen.tsx'
import DownloadHandler from '../components/DownloadHandler.tsx'
import ErrorScreen from '../components/ErrorScreen.tsx'

export default function UploadPage(): JSX.Element {
  const [transceiver, setTransceiver] = useState<TransceiverPeer | null>(null)
  const [sendState, setSendState] = useState<PeerState>(PeerState.CONNECTING_TO_RELAY)

  const [selectedSendStreams, setSelectedSendStreams] = useState<FileSendStream[]>([])

  const [peers, setPeers] = useState<DeviceInformation[]>([])
  const [selectedPeer, setSelectedPeer] = useState<RemotePeer | null>(null)

  const peerId = useMemo(() => transceiver?.getPeerId(), [transceiver])

  useEffect(() => {
    TransceiverPeer.setupTransceiver().then(setTransceiver)
  }, [])

  useEffect(() => {
    if (transceiver) {
      transceiver.getDeviceManager().addPeerConnectListener(onPeerConnect)
    }
  }, [transceiver])

  function onPeerConnect(peer: RemotePeer): void {
    setPeers(peers => [...peers, peer.getDeviceInformation()])

    peer.addChangeListener(() =>
      setPeers(peers => peers.map(p => (p.peerId.equals(peer.getPeerId()) ? peer.getDeviceInformation() : p))),
    )
    peer.addStateChangeListener((state: PeerState) => onStateUpdate(peer.getPeerId(), state))
    peer.addCloseListener(() => setPeers(peers => peers.filter(p => !p.peerId.equals(peer.getPeerId()))))
  }

  function onStateUpdate(peerId: PeerId, newState: PeerState): void {
    setSelectedPeer(peer => {
      if (peerId.equals(peer?.getPeerId())) {
        setSendState(newState)
      }

      return peer
    })
  }

  async function resetUpload(): Promise<void> {
    selectedPeer?.reset()

    setSelectedPeer(null)
    setSelectedSendStreams([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {selectedPeer ? (
            sendState === PeerState.ERROR ? (
              <ErrorScreen errorState={selectedPeer.getErrorState()!}>
                <button
                  onClick={resetUpload}
                  className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Try Again
                </button>
              </ErrorScreen>
            ) : selectedSendStreams.length > 0 ? (
              sendState === PeerState.AWAITING_APPROVAL ? (
                <WaitingScreen
                  title="Waiting for the device to accept the transfer"
                  description="Please check the receiving device to approve the file transfer."
                />
              ) : sendState === PeerState.REJECTED ? (
                <ErrorScreen
                  title="Transfer Rejected"
                  description="The receiving device rejected the file transfer. You can try sending again."
                >
                  <button
                    onClick={resetUpload}
                    className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                  >
                    Try Again
                  </button>
                </ErrorScreen>
              ) : sendState === PeerState.EXCHANGING ? (
                <div>
                  <h3 className="mb-6 font-medium text-gray-900 text-xl">Uploading Files</h3>
                  <div className="space-y-4">
                    {selectedSendStreams.map((stream, index) => (
                      <FileStreamProgress key={index} stream={stream} />
                    ))}
                  </div>
                </div>
              ) : sendState === PeerState.DONE ? (
                <SuccessScreen title="Transfer Complete!" description="All files have been successfully uploaded.">
                  <button
                    onClick={resetUpload}
                    className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
                  >
                    Send More Files
                  </button>
                </SuccessScreen>
              ) : null
            ) : (
              <FilePicker
                selectedDevice={selectedPeer.getDeviceInformation()}
                goBack={() => setSelectedPeer(null)}
                onFilesSelected={(files: File[]) =>
                  Promise.all(files.map(file => selectedPeer!.sendFile(file))).then(setSelectedSendStreams)
                }
              />
            )
          ) : (
            <DownloadHandler
              receiverPeer={transceiver}
              connectedState={
                <>
                  <h1 className="mb-6 font-bold text-2xl text-gray-900">Send Files</h1>

                  {peers.length === 0 && (
                    <WaitingScreen
                      title="No Devices Found"
                      description="Please ensure that other devices are connected to the same network and on the same page or scan the QR code below to connect."
                    />
                  )}

                  <PeerSelector
                    title="Local Devices"
                    peers={peers.filter(p => p.origin === 'local')}
                    onSelect={(peer: DeviceInformation) => {
                      const remotePeer = transceiver?.getDeviceManager().getPeer(peer.peerId)
                      if (remotePeer) {
                        setSelectedPeer(remotePeer)
                      }
                    }}
                  />

                  <PeerSelector
                    title="Remote Devices"
                    peers={peers.filter(p => p.origin === 'remote')}
                    onSelect={(peer: DeviceInformation) => {
                      const remotePeer = transceiver?.getDeviceManager().getPeer(peer.peerId)
                      if (remotePeer) {
                        setSelectedPeer(remotePeer)
                      }
                    }}
                  />

                  <div className="border-gray-200 border-t pt-6">
                    <P2PLink peerId={peerId?.toString()} />
                  </div>
                </>
              }
            />
          )}
        </div>
      </div>

      <footer className="mt-5 text-center">
        <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
          <a
            href="https://github.com/dries-c/p2p-file-transfer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
          >
            <img src="/github.svg" alt="GitHub" className="h-5 w-5" />
          </a>
        </div>
      </footer>
    </div>
  )
}
