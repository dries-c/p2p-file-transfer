import type {JSX} from 'react'
import DeviceIcon from '../DeviceIcon.tsx'
import type {DeviceInformation} from '../../common/io/peer/RemotePeer.ts'

export interface DeviceSelectorProps {
  peers: DeviceInformation[]
  onSelect: (peer: DeviceInformation) => void
}

export default function DeviceSelector(props: DeviceSelectorProps): JSX.Element {
  return (
    <div>
      <h3 className="mb-4 font-medium text-gray-900 text-lg">Select Destination</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {props.peers.map(peer => {
          return (
            <button
              key={peer.peerId.toString()}
              onClick={() => props.onSelect(peer)}
              className="rounded-lg border-2 border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center space-x-3">
                <div className="text-blue-500">
                  <DeviceIcon type={peer.type} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{peer?.name}</p>
                  <p className="text-green-600 text-sm">{peer ? 'Online' : 'Unknown Device'}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
