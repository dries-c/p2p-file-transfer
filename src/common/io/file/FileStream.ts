import type {FileInfo} from '../../file.ts'
import {FileStreamStats} from './FileStreamStats.ts'
import type {Stream} from '@libp2p/interface'
import {type LengthPrefixedStream, lpStream} from '@libp2p/utils'

export enum FileStreamState {
  PENDING,
  AWAITING_APPROVAL,
  EXCHANGING,
  REJECTED,
  DONE,
  CLOSED,
}

export abstract class FileStream {
  private fileInfo: FileInfo | undefined

  protected lp: LengthPrefixedStream
  protected state: FileStreamState = FileStreamState.PENDING
  protected stats: FileStreamStats | undefined

  private stateChangeListeners: ((state: FileStreamState) => void)[] = []

  protected constructor(private readonly stream: Stream) {
    this.lp = lpStream(stream)
  }

  protected setState(state: FileStreamState): void {
    this.state = state
    for (const listener of this.stateChangeListeners) {
      listener(state)
    }
  }

  protected async read(): Promise<ReturnType<LengthPrefixedStream['read']>> {
    try {
      return await this.lp.read()
    } catch (error) {
      this.setState(FileStreamState.CLOSED)
      throw error
    }
  }

  protected async write(data: Uint8Array): Promise<void> {
    try {
      await this.lp.write(data)
    } catch (error) {
      this.setState(FileStreamState.CLOSED)
      throw error
    }
  }

  addStateChangeListener(listener: (state: FileStreamState) => void): void {
    this.stateChangeListeners.push(listener)
  }

  getFileInfo(): FileInfo | undefined {
    return this.fileInfo
  }

  setFileInfo(fileInfo: FileInfo): void {
    this.fileInfo = fileInfo
    this.stats = new FileStreamStats(fileInfo.size)
  }

  getStats(): FileStreamStats | undefined {
    return this.stats
  }

  getState(): FileStreamState {
    return this.state
  }

  async close(): Promise<void> {
    await this.stream.close()
  }
}
