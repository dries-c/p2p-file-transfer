import type {JSX} from 'react'
import {ErrorState} from '../common/io/peer/Peer.ts'

export interface ErrorScreenProps {
  title?: string
  description?: string
  errorState?: ErrorState
  children?: JSX.Element | JSX.Element[]
}

export default function ErrorScreen(props: ErrorScreenProps): JSX.Element {
  let title
  let description

  switch (props.errorState) {
    case ErrorState.RELAY_UNREACHABLE:
      title = 'Relay Server Unreachable'
      description = 'Unable to connect to the relay server. Please check your internet connection and try again.'
      break
    case ErrorState.NO_WEBRTC_MULTIADDR:
      title = 'Unreachable via WebRTC'
      description =
        "Your browser is not reachable via WebRTC. This may be due to browser settings or network restrictions. Please check your browser's permissions and try again."
      break
    case ErrorState.PEER_UNREACHABLE:
      title = 'Peer Unreachable'
      description =
        'Unable to connect to the peer. This may be due to network issues or the peer being offline. Please check your connection and try again.'
      break
    case ErrorState.UNKNOWN:
      title = 'Unknown error'
      description = 'An unexpected error occurred. Please try again later.'
      break
    default:
      title = props.title
      description = props.description
      break
  }

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M12 17a5 5 0 100-10 5 5 0 000 10z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-medium text-gray-900 text-xl">{title}</h3>
      <p className="mb-6 text-gray-600">{description}</p>

      {props.children}
    </div>
  )
}
