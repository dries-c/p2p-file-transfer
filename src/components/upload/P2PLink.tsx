import {type JSX, useMemo} from 'react'
import {QRCodeCanvas} from 'qrcode.react'
import {toast, ToastContainer} from 'react-toastify'
import {DEFAULT_TOAST_OPTIONS} from '../../common/constants.ts'

export interface P2PLinkProps {
  peerId?: string
}

export default function P2PLink(props: P2PLinkProps): JSX.Element {
  const transferLink = useMemo(() => {
    if (props.peerId) {
      const url = new URL(window.location.href)
      url.pathname = '/download'
      url.searchParams.set('peerId', props.peerId)

      return url.toString()
    }

    return null
  }, [props.peerId])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transferLink || '')
      toast.success('Link copied to clipboard', DEFAULT_TOAST_OPTIONS)
    } catch (error) {
      toast.error('Failed to copy link to clipboard', DEFAULT_TOAST_OPTIONS)
    }
  }

  if (!transferLink) {
    return <></>
  }

  return (
    <div className="rounded-lg bg-blue-50 p-6">
      <h3 className="mb-4 font-medium text-gray-900 text-lg">Share Link</h3>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          onClick={copyToClipboard}
          value={transferLink}
          readOnly
          className="flex-1 rounded-lg border border-gray-300 bg-white p-3"
        />
      </div>
      <div className="flex justify-center">
        <div className="flex size-64 items-center justify-center rounded-lg border-2 border-gray-200 bg-white">
          <QRCodeCanvas value={transferLink} size={240} />
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
