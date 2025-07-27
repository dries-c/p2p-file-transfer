import type React from 'react'
import {type JSX, useState} from 'react'
import {formatFileSize} from '../../common/file.ts'
import DeviceIcon from '../DeviceIcon.tsx'
import type {DeviceInformation} from '../../common/io/peer/RemotePeer.ts'
import {CloudArrowUpIcon, DocumentTextIcon} from '@heroicons/react/24/outline'

export interface FilePickerProps {
  selectedDevice: DeviceInformation
  goBack: () => void
  onFilesSelected: (files: File[]) => void
}

export default function FilePicker(props: FilePickerProps): JSX.Element {
  const {selectedDevice, goBack} = props
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files

    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  return (
    <>
      {/* Show selected device */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-blue-500">
              <DeviceIcon type={selectedDevice.type} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Sending to: {selectedDevice.name}</p>
              <p className="text-gray-500 text-sm">Direct transfer</p>
            </div>
          </div>
          <button onClick={() => goBack()} className="font-medium text-blue-600 hover:text-blue-800">
            Change
          </button>
        </div>
      </div>

      {/* File Selection */}
      <div className="mb-8">
        <label className="mb-2 block font-medium text-gray-700 text-sm">Select Files to Send</label>
        <div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center transition-colors hover:border-gray-400">
          <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-input" />
          <label htmlFor="file-input" className="cursor-pointer">
            <CloudArrowUpIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden="true" />
            <p className="mb-2 font-medium text-gray-900 text-lg">Click to select files</p>
            <p className="text-gray-500">or drag and drop files here</p>
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <>
          {/* Selected Files */}
          <div className="mb-8">
            <h3 className="mb-4 font-medium text-gray-900 text-lg">Selected Files</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-gray-900 overflow-ellipsis">{file.name}</p>
                      <p className="text-gray-500 text-sm">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Transfer Button */}
          <div className="flex justify-center">
            <button
              onClick={() => props.onFilesSelected(selectedFiles)}
              className="rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
            >
              {`Send to ${selectedDevice.name}`}
            </button>
          </div>
        </>
      )}
    </>
  )
}
