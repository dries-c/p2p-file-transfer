import type {JSX} from 'react'
import type {DeviceType} from '../common/io/peer/RemotePeer.ts'
import {ComputerDesktopIcon, DevicePhoneMobileIcon, LinkIcon} from '@heroicons/react/24/outline'

export interface DeviceIconProps {
  type?: DeviceType
}

export default function DeviceIcon(props: DeviceIconProps): JSX.Element {
  switch (props.type) {
    case 'computer':
      return <ComputerDesktopIcon className="h-6 w-6" aria-hidden="true" />
    case 'mobile':
      return <DevicePhoneMobileIcon className="h-6 w-6" aria-hidden="true" />
    default:
      return <LinkIcon className="h-6 w-6" aria-hidden="true" />
  }
}
