import {type JSX, useEffect, useState} from 'react'
import {PeerState} from '../common/io/peer/Peer.ts'
import WaitingScreen from './WaitingScreen.tsx'
import StreamSelector from './download/StreamSelector.tsx'
import {saveFile, startDownload} from '../common/file.ts'
import FileStreamProgress from './download/FileStreamProgress.tsx'
import type {ReceiverPeer} from '../common/io/peer/ReceiverPeer.ts'
import type {FileReceiveStream} from '../common/io/file/FileReceiveStream.ts'
import SuccessScreen from './SuccessScreen.tsx'
import ErrorScreen from './ErrorScreen.tsx'
import {useWakeLock} from 'react-screen-wake-lock'

export interface DownloadHandlerProps {
  receiverPeer: ReceiverPeer | null
  connectedState?: JSX.Element
}

export default function DownloadHandler(props: DownloadHandlerProps): JSX.Element {
  const {isSupported, request, release} = useWakeLock()

  const [streams, setStreams] = useState<FileReceiveStream[]>([])
  const [selectedStreams, setSelectedStreams] = useState<FileReceiveStream[]>([])
  const [peerState, setPeerState] = useState<PeerState>(props.receiverPeer?.getState() ?? PeerState.CONNECTING_TO_RELAY)
  const [isNoSleepEnabled, setIsNoSleepEnabled] = useState(false)

  useEffect(() => {
    if (props.receiverPeer) {
      setStreams(props.receiverPeer.getStreams())
      props.receiverPeer.addFileReceiveStreamListener(stream =>
        setStreams(streams => (streams.includes(stream) ? streams : [...streams, stream])),
      )

      props.receiverPeer.addStateChangeListener(setPeerState)
    }

    return () => {
      props.receiverPeer?.removeStateChangeListener(setPeerState)
      props.receiverPeer?.removeFileReceiveStreamListener(stream => setStreams(streams => [...streams, stream]))
    }
  }, [props.receiverPeer])

  useEffect(() => {
    for (const stream of selectedStreams) {
      stream.addFileReceiveListener(saveFile)
    }
  }, [selectedStreams])

  useEffect(() => {
    if (isSupported) {
      if (peerState === PeerState.EXCHANGING) {
        if (!isNoSleepEnabled) {
          setIsNoSleepEnabled(true)
          request()
        }
      } else if (isNoSleepEnabled) {
        setIsNoSleepEnabled(false)
        release()
      }
    }
  }, [peerState])

  async function resetDownload(): Promise<void> {
    setStreams([])
    setSelectedStreams([])

    props.receiverPeer?.reset()
  }

  if (peerState === PeerState.ERROR) {
    return <ErrorScreen errorState={props.receiverPeer!.getErrorState()!} />
  }

  if (peerState === PeerState.CONNECTING_TO_RELAY) {
    return <WaitingScreen title="Connecting to Relay" description="Please wait while we connect to the relay server." />
  }

  if (peerState === PeerState.CONNECTED) {
    if (props.connectedState) {
      return props.connectedState
    }

    return (
      <WaitingScreen
        title="Waiting for files"
        description="Please wait while the device prepares the files for download."
      />
    )
  }

  if (peerState === PeerState.AWAITING_APPROVAL) {
    return (
      <StreamSelector
        streams={streams}
        onStreamsSelected={selectedStreams => {
          setSelectedStreams(selectedStreams)
          startDownload(streams, selectedStreams)
        }}
      />
    )
  }

  if (peerState === PeerState.EXCHANGING) {
    return (
      <div>
        <h3 className="mb-6 font-medium text-gray-900 text-xl">Downloading Files</h3>
        <div className="space-y-4">
          {selectedStreams.map((stream, index) => (
            <FileStreamProgress key={index} stream={stream} />
          ))}
        </div>
      </div>
    )
  }

  if (peerState === PeerState.DONE) {
    return (
      <SuccessScreen title="Download Complete!" description="All selected files have been successfully downloaded.">
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={resetDownload}>
          Start New Download
        </button>
      </SuccessScreen>
    )
  }

  return <div className="text-red-500">Unexpected peer state: {peerState}</div>
}
