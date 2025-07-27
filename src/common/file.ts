import type {FileReceiveStream} from './io/file/FileReceiveStream.ts'

export interface FileInfo {
  name: string
  size: number
  type: string
}

export async function getFileInfo(file: File): Promise<FileInfo> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function startDownload(streams: FileReceiveStream[], selectedStreams: FileReceiveStream[]): void {
  for (const stream of streams) {
    if (selectedStreams.includes(stream)) {
      stream.approveFile()
    } else {
      stream.rejectFile()
    }
  }
}

export async function saveFile(file: File): Promise<void> {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
