import type {JSX} from 'react'
import {CheckIcon} from '@heroicons/react/24/outline'

export interface SuccessScreenProps {
  title: string
  description: string
  children?: JSX.Element | JSX.Element[]
}

export default function SuccessScreen(props: SuccessScreenProps): JSX.Element {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckIcon className="h-8 w-8 text-green-500" aria-hidden="true" />
      </div>
      <h3 className="mb-2 font-medium text-gray-900 text-xl">{props.title}</h3>
      <p className="mb-6 text-gray-600">{props.description}</p>

      {props.children}
    </div>
  )
}
