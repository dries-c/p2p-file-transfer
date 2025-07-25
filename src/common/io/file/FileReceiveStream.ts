import {FileStream, FileStreamState} from './FileStream.ts'
import {lpStream} from 'it-length-prefixed-stream'
import type {FileInfo} from '../../file.ts'
import type {Duplex} from 'it-stream-types'

export class FileReceiveStream extends FileStream {
  private fileReceiveListeners: ((file: File) => void)[] = []

  constructor(stream: Duplex<any, any, any>) {
    super(lpStream(stream))

    this.readFileInfo().then((fileInfo: FileInfo) => {
      this.setFileInfo(fileInfo)
      this.setState(FileStreamState.AWAITING_APPROVAL)
    })
  }

  async approveFile(): Promise<void> {
    await this.writeApprovalResponse(true)
    this.notifyFileReceived(await this.readFileData(this.getFileInfo()!))
  }

  async rejectFile(): Promise<void> {
    await this.writeApprovalResponse(false)
  }

  private async writeApprovalResponse(approved: boolean): Promise<void> {
    this.setState(approved ? FileStreamState.EXCHANGING : FileStreamState.REJECTED)
    await this.lp.write(Uint8Array.of(approved ? 1 : 0))
  }

  private async readFileInfo(): Promise<FileInfo> {
    const req = await this.lp.read()
    return JSON.parse(new TextDecoder().decode(req.subarray()))
  }

  private async readFileData(fileInfo: FileInfo): Promise<File> {
    const chunks: Uint8Array[] = []
    let received = 0

    while (received < fileInfo.size) {
      const chunk = await this.lp.read()
      if (!chunk) break
      chunks.push(chunk.subarray())
      received += chunk.length

      this.stats!.update(chunk.length)
    }

    const fileData = new Blob(chunks, {type: fileInfo.type})
    return new File([fileData], fileInfo.name, {type: fileInfo.type})
  }

  addFileReceiveListener(listener: (file: File) => void): void {
    this.fileReceiveListeners.push(listener)
  }

  private notifyFileReceived(file: File): void {
    this.setState(FileStreamState.DONE)

    for (const listener of this.fileReceiveListeners) {
      listener(file)
    }
  }
}
