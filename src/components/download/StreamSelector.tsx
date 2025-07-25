import type {JSX, Dispatch, SetStateAction} from 'react'
import {formatFileSize} from '../../common/file.ts'
import type {FileStream} from '../../common/io/file/FileStream.ts'

export interface StreamSelectorProps<T> {
  streams: T[]
  selectedStreams: T[]
  setSelectedStreams: Dispatch<SetStateAction<T[]>>
}

export default function StreamSelector<T extends FileStream>(props: StreamSelectorProps<T>): JSX.Element {
  const {streams, selectedStreams, setSelectedStreams} = props

  function toggleFileSelection(stream: T, isSelected: boolean): void {
    setSelectedStreams(prev => {
      if (isSelected) {
        return prev.filter(s => s !== stream)
      } else {
        return [...prev, stream]
      }
    })
  }

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 text-lg">Available Files</h3>
        <div className="space-x-2">
          <button
            onClick={() => setSelectedStreams(streams)}
            className="px-4 py-2 font-medium text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedStreams([])}
            className="px-4 py-2 font-medium text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {streams.map((stream, index) => {
          const isSelected = selectedStreams.includes(stream)
          const fileInfo = stream.getFileInfo()

          return (
            <div
              key={index}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleFileSelection(stream, isSelected)}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleFileSelection(stream, isSelected)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  {fileInfo ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{fileInfo.name}</span>
                      <span className="text-gray-500 text-sm">{formatFileSize(fileInfo.size)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Loading file info...</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
