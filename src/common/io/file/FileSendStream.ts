import {FileStream, FileStreamState} from './FileStream.ts'
import type {Duplex} from 'it-stream-types'
import {lpStream} from 'it-length-prefixed-stream'
import {getFileInfo} from '../../file.ts'

export class FileSendStream extends FileStream {
  constructor(stream: Duplex<any, any, any>, file: File) {
    super(lpStream(stream))

    getFileInfo(file).then(fileInfo => {
      this.setFileInfo(fileInfo)
      this.sendFileInfo().then(() => {
        this.setState(FileStreamState.AWAITING_APPROVAL)
        this.awaitApproval().then(approved => {
          this.setState(approved ? FileStreamState.EXCHANGING : FileStreamState.REJECTED)
          if (approved) {
            this.sendFileData(file).then(() => this.setState(FileStreamState.DONE))
          }
        })
      })
    })
  }

  private async awaitApproval(): Promise<boolean> {
    const response = await this.lp.read()

    try {
      return response.get(0) === 1
    } catch (_error) {
      throw new Error('Invalid response received for file approval')
    }
  }

  private async sendFileInfo(): Promise<void> {
    await this.lp.write(new TextEncoder().encode(JSON.stringify(this.getFileInfo()!)))
  }

  private async sendFileData(file: File): Promise<void> {
    const fileStream = file.stream()
    const reader = fileStream.getReader()

    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      await this.lp.write(value)

      this.stats!.update(value.length)
    }
  }
}
