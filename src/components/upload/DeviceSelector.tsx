import {type JSX, useMemo} from 'react'
import DeviceIcon, {type DeviceType} from '../DeviceIcon.tsx'

export interface Device {
  id: string
  name: string
  type: DeviceType
}

export interface DeviceSelectorProps {
  localDevices: Device[]
  onSelect: (device: Device) => void
}

export default function DeviceSelector(props: DeviceSelectorProps): JSX.Element {
  const devices = useMemo(
    () => [{id: 'p2p', name: 'Share via link', type: 'p2p'} as Device, ...props.localDevices],
    [props.localDevices],
  )

  return (
    <div>
      <h3 className="mb-4 font-medium text-gray-900 text-lg">Select Destination</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {devices.map(device => (
          <button
            key={device.id}
            onClick={() => props.onSelect(device)}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              'p2p' === device.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                <DeviceIcon type={device.type} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{device.name}</p>
                <p className="text-green-600 text-sm">{device.id === 'p2p' ? 'Share via link' : 'online'}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => props.onSelect(devices[0])}
          className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Continue with P2P
        </button>
      </div>
    </div>
  )
}
