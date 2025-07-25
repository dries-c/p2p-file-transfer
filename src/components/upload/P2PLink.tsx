import {type JSX, useMemo} from 'react'
import {QRCodeCanvas} from 'qrcode.react'

export interface P2PLinkProps {
  connectionAddress?: string
}

export default function P2PLink(props: P2PLinkProps): JSX.Element {
  const transferLink = useMemo(() => {
    if (props.connectionAddress) {
      const url = new URL(window.location.href)
      url.pathname = '/download'
      url.searchParams.set('addr', props.connectionAddress)

      return url.toString()
    }

    return null
  }, [props.connectionAddress])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transferLink || '')
      // You could add a toast notification here
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!transferLink) {
    return <p className="text-gray-500 text-sm">Generating transfer link...</p>
  }

  return (
    <>
      <h3 className="mb-4 font-medium text-gray-900 text-lg">Share Link</h3>
      <div className="mb-4 flex items-center space-x-4">
        <input
          type="text"
          value={transferLink}
          readOnly
          className="flex-1 rounded-lg border border-gray-300 bg-white p-3"
        />
        <button
          className="rounded-lg bg-blue-500 px-4 py-3 text-white transition-colors hover:bg-blue-600"
          onClick={copyToClipboard}
        >
          Copy
        </button>
      </div>
      <div className="flex justify-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-gray-200 bg-white">
          <QRCodeCanvas value={transferLink} size={120} />
        </div>
      </div>
    </>
  )
}
