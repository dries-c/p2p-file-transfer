import {type JSX, useRef, useState} from 'react'
import {QRCodeCanvas} from 'qrcode.react'
import {sendFile} from '../common/p2p.ts'
import { type FileInfo, getFileInfo } from "../common/file.ts";

export default function Root(): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsGenerating(true)

    console.log('Selected file:', file)
    const multiAddr = await sendFile(file)
    console.log('Multiaddr:', multiAddr)

    const url = new URL(window.location.href)
    url.pathname = '/download'
    url.searchParams.set('addr', multiAddr)
    const shareableUrl = url.toString()

    try {
      setShareUrl(shareableUrl)
      setSelectedFile(getFileInfo(file))
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const resetTransfer = () => {
    setSelectedFile(null)
    setShareUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-3xl text-gray-900">File Transfer</h1>
          <p className="text-gray-600">Share files instantly with QR codes</p>
        </div>

        {!selectedFile ? (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="rounded-lg border-2 border-gray-300 border-dashed p-12 text-center transition-colors hover:border-gray-400">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-lg">Select a file to share</h3>
              <p className="mb-4 text-gray-500">Choose any file from your device</p>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" id="file-input" />
              <label
                htmlFor="file-input"
                className="inline-flex cursor-pointer items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 font-medium text-base text-white transition-colors hover:bg-blue-700"
              >
                Choose File
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            </div>

            {/* QR Code and Link */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-center font-semibold text-gray-900 text-xl">Share this file</h2>

              {isGenerating ? (
                <div className="py-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
                  <p className="mt-2 text-gray-600">Generating QR code...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="inline-block rounded-lg border-2 border-gray-200 bg-white p-4">
                      <QRCodeCanvas
                        marginSize={4}
                        level="Q"
                        size={500}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        value={shareUrl || 'https://filetransfer.app'}
                      />
                    </div>
                    <p className="mt-2 text-gray-600 text-sm">Scan with your device's camera</p>
                  </div>

                  {/* Share Link */}
                  <div>
                    <label className="mb-2 block font-medium text-gray-700 text-sm">Or share this link:</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="rounded-md bg-gray-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-gray-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetTransfer}
                className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Share Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
