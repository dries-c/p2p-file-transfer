import {
  DEVICE_INFORMATION_PROTOCOL,
  ErrorState,
  FILE_TRANSFER_PROTOCOL,
  getBaseOptions,
  Peer,
  PeerState,
} from './Peer.ts'
import {createLibp2p, type Libp2p} from 'libp2p'
import type {Multiaddr} from '@multiformats/multiaddr'
import {FileReceiveStream} from '../file/FileReceiveStream.ts'
import {type Connection, ConnectionFailedError, InvalidMessageError, type PeerId, TimeoutError} from '@libp2p/interface'
import {UAParser} from 'ua-parser-js'
import {lpStream} from '@libp2p/utils'

export type FileReceiverStreamListener = (stream: FileReceiveStream) => void

export class ReceiverPeer extends Peer<FileReceiveStream> {
  private fileReceiveStreamListeners: FileReceiverStreamListener[] = []

  static async setupReceiver(multiAddr: Multiaddr): Promise<ReceiverPeer> {
    const node = await createLibp2p(getBaseOptions())

    const receiverPeer = new ReceiverPeer(node)

    receiverPeer.dial(multiAddr).then(async connection => {
      if (connection) {
        await receiverPeer.sendDeviceInformation(connection)
        receiverPeer.setState(PeerState.CONNECTED)
      }
    })

    return receiverPeer
  }

  constructor(protected readonly node: Libp2p) {
    super()

    node.handle(FILE_TRANSFER_PROTOCOL, async s => {
      if (this.getState() === PeerState.CONNECTED) {
        const stream = new FileReceiveStream(s)

        this.addStream(stream)
        this.onFileStreamReceived(stream)
      } else {
        await s.close()
      }
    })
  }

  protected async dial(multiAddr: Multiaddr): Promise<Connection | null> {
    try {
      return await this.node.dial(multiAddr)
    } catch (error) {
      if (error instanceof ConnectionFailedError || error instanceof TimeoutError) {
        this.setErrorState(ErrorState.RELAY_UNREACHABLE)
      } else if (
        error instanceof InvalidMessageError &&
        error.message.includes('failed to connect via relay with status NO_RESERVATION')
      ) {
        this.setErrorState(ErrorState.PEER_UNREACHABLE)
      } else if (error instanceof Error && error.message.includes('signal timed out')) {
        this.setErrorState(ErrorState.RELAY_UNREACHABLE)
      } else {
        console.error('Unexpected error while setting up connection:', error)
        this.setErrorState(ErrorState.UNKNOWN)
      }
    }

    return null
  }

  addFileReceiveStreamListener(listener: FileReceiverStreamListener): void {
    this.fileReceiveStreamListeners.push(listener)
  }

  removeFileReceiveStreamListener(listener: FileReceiverStreamListener): void {
    const index = this.fileReceiveStreamListeners.indexOf(listener)

    if (index !== -1) {
      this.fileReceiveStreamListeners.splice(index, 1)
    }
  }

  private onFileStreamReceived(stream: FileReceiveStream): void {
    for (const listener of this.fileReceiveStreamListeners) {
      listener(stream)
    }
  }

  async sendDeviceInformation(connection: Connection): Promise<void> {
    const uaParser = UAParser(navigator.userAgent)

    const lp = lpStream(await connection.newStream([DEVICE_INFORMATION_PROTOCOL]))
    await lp.write(
      new TextEncoder().encode(
        JSON.stringify({
          name: uaParser.device.toString(),
          type: uaParser.device.type === 'mobile' ? 'mobile' : 'computer',
        }),
      ),
    )
  }

  getPeerId(): PeerId {
    return this.node.peerId
  }

  async stop(): Promise<void> {
    await this.node.stop()
  }
}
