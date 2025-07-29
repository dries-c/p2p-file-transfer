import {FileStream, FileStreamState} from './FileStream.ts'
import {getFileInfo} from '../../file.ts'
import type {Stream} from '@libp2p/interface'

export class FileSendStream extends FileStream {
  constructor(stream: Stream, file: File) {
    super(stream)

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
    const response = await this.read()

    try {
      return response.get(0) === 1
    } catch (_error) {
      throw new Error('Invalid response received for file approval')
    }
  }

  private async sendFileInfo(): Promise<void> {
    await this.write(new TextEncoder().encode(JSON.stringify(this.getFileInfo()!)))
  }

  private async sendFileData(file: File): Promise<void> {
    const fileStream = file.stream()
    const reader = fileStream.getReader()

    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      await this.write(value)

      this.stats!.update(value.length)
    }

    await this.close()
  }
}
