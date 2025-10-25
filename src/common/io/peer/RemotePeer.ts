import type {Connection, PeerId, Stream} from '@libp2p/interface'
import {FileSendStream} from '../file/FileSendStream.ts'
import {ErrorState, FILE_TRANSFER_PROTOCOL, Peer} from './Peer.ts'
import {lpStream} from '@libp2p/utils'

export type DeviceType = 'computer' | 'mobile'

export interface DeviceInformation {
  peerId: PeerId
  origin: 'local' | 'remote'
  name?: string
  type?: DeviceType
}

export class RemotePeer extends Peer<FileSendStream> {
  private closeListeners: (() => void)[] = []
  private changeListeners: (() => void)[] = []

  private connection: Connection
  private deviceInformation: DeviceInformation

  constructor(connection: Connection, isLocal = false) {
    super()
    this.connection = connection
    this.deviceInformation = {peerId: connection.remotePeer, origin: isLocal ? 'local' : 'remote'}
  }

  addCloseListener(listener: () => void): void {
    this.closeListeners.push(listener)
  }

  addChangeListener(listener: () => void): void {
    this.changeListeners.push(listener)
  }

  async handleDeviceInformation(stream: Stream): Promise<void> {
    const lp = lpStream(stream)
    const req = await lp.read()

    const origin = this.deviceInformation.origin
    this.deviceInformation = JSON.parse(new TextDecoder().decode(req.subarray())) as DeviceInformation
    this.deviceInformation.peerId = this.connection.remotePeer
    this.deviceInformation.origin = origin

    this.onChange()
  }

  getPeerId(): PeerId {
    return this.connection.remotePeer
  }

  getDeviceInformation(): DeviceInformation {
    return this.deviceInformation
  }

  onConnectionClose(_event: CustomEvent<Connection>) {
    this.setErrorState(ErrorState.PEER_UNREACHABLE)
    this.onClose()
  }

  async sendFile(file: File): Promise<FileSendStream> {
    const fileStream = new FileSendStream(await this.connection.newStream([FILE_TRANSFER_PROTOCOL]), file)
    this.addStream(fileStream)

    return fileStream
  }

  private onClose(): void {
    for (const listener of this.closeListeners) {
      listener()
    }
  }

  private onChange(): void {
    for (const listener of this.changeListeners) {
      listener()
    }
  }

  setConnection(connection: Connection) {
    this.connection = connection
  }
}
