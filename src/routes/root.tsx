import { JSX, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { test } from "../common/p2p";

interface FileData {
  name: string
  size: number
  type: string
  url: string
}


export default function Root(): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if( typeof window === "undefined") return;

    test()
  }, [typeof window]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);

    // Create a mock file URL (in a real app, you'd upload to a server)
    const fileUrl = URL.createObjectURL(file);

    // Generate a shareable link (mock URL)
    const shareableUrl = `https://filetransfer.app/download/${Math.random().toString(36).substring(2, 15)}`;

    const fileData: FileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl
    };

    try {
      setSelectedFile(fileData);
      setShareUrl(shareableUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const resetTransfer = () => {
    setSelectedFile(null);
    setShareUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">File Transfer</h1>
          <p className="text-gray-600">Share files instantly with QR codes</p>
        </div>

        {!selectedFile ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a file to share</h3>
              <p className="text-gray-500 mb-4">Choose any file from your device</p>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" id="file-input" />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Choose File
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Share this file</h2>

              {isGenerating ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Generating QR code...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <QRCodeCanvas
                        marginSize={4}
                        level="Q"
                        size={500}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        value={shareUrl || "https://filetransfer.app"}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Scan with your device's camera</p>
                  </div>

                  {/* Share Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or share this link:</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
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
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Share Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
