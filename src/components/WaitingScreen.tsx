import type {JSX} from 'react'

export interface WaitingScreenProps {
  title: string
  description: string
}

export default function WaitingScreen(props: WaitingScreenProps): JSX.Element {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <h3 className="mb-2 font-medium text-gray-900 text-xl">{props.title}</h3>
      <p className="text-gray-600">{props.description}</p>
    </div>
  )
}
