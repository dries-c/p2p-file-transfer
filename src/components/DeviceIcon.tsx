import type {JSX} from 'react'
import type {DeviceType} from '../common/io/peer/RemotePeer.ts'

export interface DeviceIconProps {
  type?: DeviceType
}

export default function DeviceIcon(props: DeviceIconProps): JSX.Element {
  switch (props.type) {
    case 'computer':
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h8M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z"
          />
        </svg>
      )
    case 'mobile':
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 4h.01M21.75 4.75A3.25 3.25 0 0018.5 1.5H5.5A3.25 3.25 0 002.25 4.75v14.5A3.25 3.25 0 005.5 22h13a3.25 3.25 0 003.25-3.25V4.75zM18.5 22H5.5a1.75 1.75 0 01-1.75-1.75V4.75A1.75 1.75 0 015.5 3h13a1.75 1.75 0 011.75 1.75v14.5A1.75 1.75 0 0118.5 22z"
          />
        </svg>
      )
    default:
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )
  }
}
