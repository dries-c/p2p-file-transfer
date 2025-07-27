import type {JSX} from 'react'

export interface SuccessScreenProps {
  title: string
  description: string
  children?: JSX.Element | JSX.Element[]
}

export default function SuccessScreen(props: SuccessScreenProps): JSX.Element {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="mb-2 font-medium text-gray-900 text-xl">{props.title}</h3>
      <p className="mb-6 text-gray-600">{props.description}</p>

      {props.children}
    </div>
  )
}
