import type {FileInfo} from '../../file.ts'
import type {LengthPrefixedStream} from 'it-length-prefixed-stream'
import {FileStreamStats} from './FileStreamStats.ts'

export enum FileStreamState {
  PENDING,
  AWAITING_APPROVAL,
  EXCHANGING,
  REJECTED,
  DONE,
}

export abstract class FileStream {
  private fileInfo: FileInfo | undefined

  protected lp: LengthPrefixedStream
  protected state: FileStreamState = FileStreamState.PENDING
  protected stats: FileStreamStats | undefined

  private stateChangeListeners: ((state: FileStreamState) => void)[] = []

  protected constructor(lp: LengthPrefixedStream) {
    this.lp = lp
  }

  protected setState(state: FileStreamState): void {
    this.state = state
    for (const listener of this.stateChangeListeners) {
      listener(state)
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
}
